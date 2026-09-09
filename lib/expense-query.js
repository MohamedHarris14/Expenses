// SERVER-ONLY. Pure helper functions for building the parameterized SQL
// used by /api/expenses and /api/export. Always builds positional
// placeholders ($1, $2, ...) with values kept separate from the SQL text —
// never concatenate user input directly into a query string.

export function monthRange(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end };
}

/**
 * filters: { month, search, category, paidBy, payType, fromDate, toDate }
 * Returns { where, values } where `where` is either "" or a "WHERE ..."
 * clause with $1, $2, ... placeholders matching `values` in order.
 */
export function buildWhereClause(filters) {
  const { month, search, category, paidBy, payType, fromDate, toDate } = filters;
  const clauses = [];
  const values = [];
  let idx = 1;

  if (month) {
    const { start, end } = monthRange(month);
    clauses.push(`expense_date >= $${idx++}`);
    values.push(start);
    clauses.push(`expense_date < $${idx++}`);
    values.push(end);
  }
  if (fromDate) {
    clauses.push(`expense_date >= $${idx++}`);
    values.push(fromDate);
  }
  if (toDate) {
    clauses.push(`expense_date <= $${idx++}`);
    values.push(toDate);
  }
  if (category) {
    clauses.push(`category = $${idx++}`);
    values.push(category);
  }
  if (paidBy) {
    clauses.push(`paid_by = $${idx++}`);
    values.push(paidBy);
  }
  if (payType) {
    clauses.push(`pay_type = $${idx++}`);
    values.push(payType);
  }
  if (search) {
    clauses.push(`description ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, values };
}
