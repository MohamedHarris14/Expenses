"use client";

import { useState } from "react";

function todayStr() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default function ExpenseForm({ categories, payTypes, initialExpense, onSubmit, onCancel }) {
  const isEdit = Boolean(initialExpense);
  const [amount, setAmount] = useState(initialExpense?.amount ?? "");
  const [description, setDescription] = useState(initialExpense?.description ?? "");
  const [category, setCategory] = useState(initialExpense?.category ?? categories[0]?.name ?? "");
  const [expenseDate, setExpenseDate] = useState(initialExpense?.expense_date ?? todayStr());
  const [payType, setPayType] = useState(initialExpense?.pay_type ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    if (!category) {
      setError("Category is required");
      return;
    }
    if (!expenseDate) {
      setError("Expense date is required");
      return;
    }
    if (!payType) {
      setError("Pay type is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({ amount: numAmount, description, category, expense_date: expenseDate, pay_type: payType });
      if (!isEdit) {
        setAmount("");
        setDescription("");
        setPayType("");
      }
    } catch (err) {
      setError(err.message || "Unable to save expense. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? "Edit expense" : "Add an expense"}</h2>
      {error && <div className="error-banner">{error}</div>}

      <label>
        Date *
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
      </label>

      <label>
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Big Bazaar groceries"
        />
      </label>

      <div className="form-row">
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount (₹) *
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Payment method *
        <select value={payType} onChange={(e) => setPayType(e.target.value)} required>
          <option value="">Select payment method</option>
          {payTypes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
        </button>
        {isEdit && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
