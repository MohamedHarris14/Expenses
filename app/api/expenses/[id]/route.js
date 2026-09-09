import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CATEGORY_META, PAY_TYPES } from "@/lib/budget";

export async function PUT(request, { params }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;

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
    // paid_by is intentionally omitted from the UPDATE — it stays with
    // whoever originally created the expense.
    const result = await sql`
      UPDATE expenses
      SET amount = ${numAmount},
          category = ${category},
          description = ${description || null},
          expense_date = ${expense_date},
          pay_type = ${pay_type},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, amount, category, description, expense_date, paid_by, pay_type, created_at, updated_at
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }
    return NextResponse.json({ expense: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/expenses/[id] error", err);
    return NextResponse.json({ error: "Unable to save expense. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;

  try {
    const result = await sql`DELETE FROM expenses WHERE id = ${id} RETURNING id`;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/expenses/[id] error", err);
    return NextResponse.json({ error: "Unable to delete expense. Please try again." }, { status: 500 });
  }
}
