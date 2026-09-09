// Fixed application configuration for categories and the household budget.
// This is intentionally NOT stored in PostgreSQL — it's static app config,
// per the project spec. Only actual spend, income, and checklist status
// are persisted to the database.

export const CATEGORY_META = {
  Home: { icon: "🏠", section: "needs" },
  Loan: { icon: "🏦", section: "needs" },
  Rent: { icon: "🏡", section: "needs" },
  EB: { icon: "💡", section: "needs" },
  Grocery: { icon: "🛒", section: "needs" },
  Baby: { icon: "🍼", section: "needs" },
  Savings: { icon: "💰", section: "needs" },

  Entertainment: { icon: "🎬", section: "wants" },
  "Eating Out": { icon: "🍽️", section: "wants" },

  Petrol: { icon: "⛽", section: "other" },
  Mobile: { icon: "📱", section: "other" },

  Insurance: {
    icon: "🛡️",
    section: "other",
    billedEvery: 3,
    billedAmount: 4000,
  },

  WiFi: {
    icon: "📶",
    section: "other",
    billedEvery: 3,
    billedAmount: 2000,
  },

  Other: { icon: "❓", section: "other" },
};

// Monthly budget amounts for categories that are NOT billed on a multi-month
// cycle. Categories with billedEvery/billedAmount (Insurance, WiFi) have
// their monthly-equivalent computed instead — see getMonthlyBudget below.
// Adjust these to match your actual household budget.
export const BUDGET_AMOUNTS = {
  Home: 18000,
  Loan: 18000,
  Rent: 12000,
  EB: 2000,
  Grocery: 10000,
  Baby: 3000,
  Savings: 0,
  Entertainment: 1000,
  "Eating Out": 2000,
  Petrol: 1000,
  Mobile: 800,
  Other: 0,
};

export const CATEGORIES = Object.keys(CATEGORY_META);

export const SECTIONS = ["needs", "wants", "other"];

export const PAY_TYPES = ["Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer", "Other"];

/**
 * The monthly-equivalent budget for a category. For categories billed
 * every N months (sinking funds like Insurance/WiFi), this divides the
 * actual bill by the billing interval. Otherwise it's the flat monthly
 * amount from BUDGET_AMOUNTS.
 */
export function getMonthlyBudget(category) {
  const meta = CATEGORY_META[category];
  if (!meta) return 0;
  if (meta.billedEvery && meta.billedAmount) {
    return meta.billedAmount / meta.billedEvery;
  }
  return BUDGET_AMOUNTS[category] ?? 0;
}

/** Total monthly budget for all categories in a given section. */
export function getSectionBudget(section) {
  return CATEGORIES.filter((c) => CATEGORY_META[c].section === section).reduce(
    (sum, c) => sum + getMonthlyBudget(c),
    0
  );
}
