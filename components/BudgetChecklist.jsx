"use client";

import { formatMoney } from "@/lib/format";

const SECTION_LABELS = { needs: "Needs", wants: "Wants", other: "Other / Recurring" };

export default function BudgetChecklist({ categories, actuals, checklist, onToggle }) {
  const checklistMap = Object.fromEntries(checklist.map((c) => [c.category, c.is_paid]));

  return (
    <div className="card checklist-card">
      <h2>Fixed Expenses</h2>
      {["needs", "wants", "other"].map((section) => {
        const cats = categories.filter((c) => c.section === section);
        if (cats.length === 0) return null;
        return (
          <div key={section}>
            <div className="section-heading">{SECTION_LABELS[section]}</div>
            {cats.map((c) => {
              const actual = actuals[c.name] || 0;
              const isPaid = Boolean(checklistMap[c.name]);
              const overBudget = c.budget > 0 && actual > c.budget;
              const pct = c.budget > 0 ? Math.min(100, (actual / c.budget) * 100) : 0;
              return (
                <div key={c.name} className={`checklist-row ${overBudget ? "over-budget" : ""}`}>
                  <label className="checklist-check">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => onToggle(c.name, e.target.checked)}
                    />
                    <span>
                      {c.icon} {c.name}
                    </span>
                  </label>
                  <div className="checklist-progress">
                    <div className="progress-track">
                      <div className={`progress-fill ${overBudget ? "over" : ""}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-text">
                      ₹{formatMoney(actual)} / ₹{formatMoney(c.budget)}
                      {overBudget && ` · over by ₹${formatMoney(actual - c.budget)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
