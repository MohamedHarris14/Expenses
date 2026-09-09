function escapeCsvValue(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Builds a CSV string from expense rows.
 * Expects rows shaped like: { expense_date, description, category, amount, paid_by, pay_type, created_at }
 */
export function expensesToCSV(rows) {
  const header = ["Date", "Description", "Category", "Amount", "Paid By", "Pay Type", "Created At"];
  const lines = rows.map((r) =>
    [r.expense_date, r.description ?? "", r.category, r.amount, r.paid_by, r.pay_type, r.created_at]
      .map(escapeCsvValue)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
