import { NextResponse } from "next/server";
import { sql, queryRaw } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CATEGORY_META, PAY_TYPES } from "@/lib/budget";
import { buildWhereClause } from "@/lib/expense-query";

function filtersFromParams(searchParams) {
  return {
    month: searchParams.get("month") || "",
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    paidBy: searchParams.get("paidBy") || "",
    payType: searchParams.get("payType") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
  };
}

export async function GET(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = filtersFromParams(searchParams);

  try {
    const { where, values } = buildWhereClause(filters);
    const text = `
      SELECT id, amount, category, description, expense_date, paid_by, pay_type, created_at, updated_at
      FROM expenses
      ${where}
      ORDER BY expense_date DESC, created_at DESC
    `;
    const result = await queryRaw(text, values);
    return NextResponse.json({ expenses: result.rows });
  } catch (err) {
    console.error("GET /api/expenses error", err);
    return NextResponse.json({ error: "Database connection error." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { amount, category, description, expense_date, pay_type } = body || {};

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }
  if (!category || !CATEGORY_META[category]) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }
  if (!expense_date) {
    return NextResponse.json({ error: "Expense date is required" }, { status: 400 });
  }
  if (!pay_type || !PAY_TYPES.includes(pay_type)) {
    return NextResponse.json({ error: "Pay type is required" }, { status: 400 });
  }

  try {
    // paid_by always comes from the authenticated session — never from the request body.
    const result = await sql`
      INSERT INTO expenses (amount, category, description, expense_date, paid_by, pay_type)
      VALUES (${numAmount}, ${category}, ${description || null}, ${expense_date}, ${session.username}, ${pay_type})
      RETURNING id, amount, category, description, expense_date, paid_by, pay_type, created_at, updated_at
    `;
    return NextResponse.json({ expense: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/expenses error", err);
    return NextResponse.json({ error: "Unable to save expense. Please try again." }, { status: 500 });
  }
}
