"use client";

import { formatMoney, formatDate } from "@/lib/format";

export default function ExpenseList({ expenses, categoryMeta, emptyMessage, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="expense-list">
      {expenses.map((e) => (
        <div key={e.id} className="expense-row">
          <div className="expense-main">
            <span className="expense-icon">{categoryMeta[e.category]?.icon || "💳"}</span>
            <div className="expense-details">
              <div className="expense-desc">{e.description || e.category}</div>
              <div className="expense-meta">
                {formatDate(e.expense_date)} · {e.category} · {e.paid_by} · {e.pay_type}
              </div>
            </div>
          </div>
          <div className="expense-right">
            <span className="expense-amount">₹{formatMoney(e.amount)}</span>
            <button className="link-btn" onClick={() => onEdit(e)}>
              Edit
            </button>
            <button className="link-btn danger" onClick={() => onDelete(e)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
