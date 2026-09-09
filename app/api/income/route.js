import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await sql`SELECT monthly_income FROM monthly_settings WHERE id = 1`;
    const raw = result.rows[0]?.monthly_income;
    return NextResponse.json({ monthly_income: raw === null || raw === undefined ? null : Number(raw) });
  } catch (err) {
    console.error("GET /api/income error", err);
    return NextResponse.json({ error: "Database connection error." }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "You do not have permission to update income." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const amount = Number(body?.monthly_income);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Income must be zero or greater" }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO monthly_settings (id, monthly_income, updated_at)
      VALUES (1, ${amount}, NOW())
      ON CONFLICT (id) DO UPDATE SET monthly_income = EXCLUDED.monthly_income, updated_at = NOW()
    `;
    return NextResponse.json({ monthly_income: amount });
  } catch (err) {
    console.error("PUT /api/income error", err);
    return NextResponse.json({ error: "Unable to save. Please try again." }, { status: 500 });
  }
}
