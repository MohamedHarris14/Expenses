import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT category, is_paid FROM budget_checklist WHERE month_key = ${month}
    `;
    return NextResponse.json({ checklist: result.rows });
  } catch (err) {
    console.error("GET /api/checklist error", err);
    return NextResponse.json({ error: "Database connection error." }, { status: 500 });
  }
}
