"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

export default function IncomeCard({ income, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(income ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit() {
    setValue(income ?? "");
    setError("");
    setEditing(true);
  }

  async function handleSave() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Income must be zero or greater");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(amount);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stat-card">
      <div className="stat-label">Monthly Income</div>
      {editing ? (
        <div className="income-edit">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {error && <div className="field-error">{error}</div>}
          <div className="income-edit-actions">
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="stat-value">{income === null ? "—" : `₹${formatMoney(income)}`}</div>
          {canEdit ? (
            <button className="link-btn" onClick={startEdit}>
              Edit Income
            </button>
          ) : (
            <span className="view-only-hint">
              {income === null ? "Only Harris can update monthly income." : "View only"}
            </span>
          )}
        </>
      )}
    </div>
  );
}
