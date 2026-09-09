import { NextResponse } from "next/server";
import { queryRaw } from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildWhereClause } from "@/lib/expense-query";
import { expensesToCSV } from "@/lib/csv";

export async function GET(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    month: searchParams.get("month") || "",
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    paidBy: searchParams.get("paidBy") || "",
    payType: searchParams.get("payType") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
  };

  try {
    const { where, values } = buildWhereClause(filters);
    const text = `
      SELECT expense_date, description, category, amount, paid_by, pay_type, created_at
      FROM expenses
      ${where}
      ORDER BY expense_date DESC, created_at DESC
    `;
    const result = await queryRaw(text, values);
    const csv = expensesToCSV(result.rows);
    const filename = filters.month ? `expenses-${filters.month}.csv` : "expenses-export.csv";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/export error", err);
    return NextResponse.json({ error: "Unable to export. Please try again." }, { status: 500 });
  }
}
