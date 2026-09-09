import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  CATEGORY_META,
  CATEGORIES,
  SECTIONS,
  PAY_TYPES,
  getMonthlyBudget,
  getSectionBudget,
} from "@/lib/budget";

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categories = CATEGORIES.map((name) => {
    const meta = CATEGORY_META[name];
    return {
      name,
      icon: meta.icon,
      section: meta.section,
      budget: getMonthlyBudget(name),
      billedEvery: meta.billedEvery || null,
      billedAmount: meta.billedAmount || null,
    };
  });

  const sections = SECTIONS.map((name) => ({ name, budget: getSectionBudget(name) }));

  return NextResponse.json({ categories, sections, payTypes: PAY_TYPES });
}
