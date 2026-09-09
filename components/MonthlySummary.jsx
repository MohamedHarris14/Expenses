"use client";

import { formatMoney } from "@/lib/format";

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MonthlySummary({ sections, actualsBySection, totalBudget, totalActual, income }) {
  const buffer = totalBudget - totalActual;
  const overUnder = income !== null ? income - totalActual : null;

  return (
    <div className="card summary-card">
      <h2>Monthly Budget Summary</h2>
      {sections.map((s) => {
        const actual = actualsBySection[s.name] || 0;
        const pct = s.budget > 0 ? Math.round((actual / s.budget) * 100) : 0;
        return (
          <div key={s.name} className="summary-row">
            <span className="summary-label">{capitalize(s.name)}</span>
            <span className="summary-value">
              ₹{formatMoney(s.budget)} ({pct}%)
            </span>
          </div>
        );
      })}
      <hr />
      <div className="summary-row">
        <span className="summary-label">Total budget</span>
        <span className="summary-value">₹{formatMoney(totalBudget)}</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Buffer</span>
        <span className={`summary-value ${buffer < 0 ? "negative" : ""}`}>
          {buffer < 0 ? "-" : ""}₹{formatMoney(Math.abs(buffer))}
        </span>
      </div>
      <div className="summary-row total">
        <span className="summary-label">Actual spend this month</span>
        <span className="summary-value">₹{formatMoney(totalActual)}</span>
      </div>
      {overUnder !== null && (
        <div className="summary-row">
          <span className="summary-label">{overUnder >= 0 ? "Remaining vs income" : "Over income"}</span>
          <span className={`summary-value ${overUnder < 0 ? "negative" : ""}`}>
            {overUnder < 0 ? "-" : ""}₹{formatMoney(Math.abs(overUnder))}
          </span>
        </div>
      )}
    </div>
  );
}
