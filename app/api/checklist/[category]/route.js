import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CATEGORY_META } from "@/lib/budget";

export async function PUT(request, { params }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const category = decodeURIComponent(params.category);
  if (!CATEGORY_META[category]) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { month, is_paid } = body || {};
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  try {
    const result = await sql`
      INSERT INTO budget_checklist (month_key, category, is_paid, updated_at)
      VALUES (${month}, ${category}, ${Boolean(is_paid)}, NOW())
      ON CONFLICT (month_key, category)
      DO UPDATE SET is_paid = EXCLUDED.is_paid, updated_at = NOW()
      RETURNING category, is_paid
    `;
    return NextResponse.json({ checklist: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/checklist/[category] error", err);
    return NextResponse.json({ error: "Unable to save. Please try again." }, { status: 500 });
  }
}
