"use client";

import { monthLabel } from "@/lib/format";

export default function MonthNavigation({ monthKey, onChange }) {
  const [year, month] = monthKey.split("-").map(Number);

  function shift(delta) {
    const d = new Date(year, month - 1 + delta, 1);
    const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    onChange(newKey);
  }

  return (
    <div className="month-nav">
      <button onClick={() => shift(-1)} aria-label="Previous month">
        ←
      </button>
      <span className="month-label">{monthLabel(monthKey)}</span>
      <button onClick={() => shift(1)} aria-label="Next month">
        →
      </button>
    </div>
  );
}
