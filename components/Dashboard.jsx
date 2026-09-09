"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import MonthNavigation from "./MonthNavigation";
import IncomeCard from "./IncomeCard";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import ExpenseFilters from "./ExpenseFilters";
import BudgetChecklist from "./BudgetChecklist";
import MonthlySummary from "./MonthlySummary";
import { formatMoney, monthLabel, currentMonthKey } from "@/lib/format";
import { PUBLIC_USERS } from "@/lib/users-public";

const EMPTY_FILTERS = { search: "", category: "", paidBy: "", payType: "", fromDate: "", toDate: "" };

export default function Dashboard({ user }) {
  const router = useRouter();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [income, setIncome] = useState(null);
  const [budget, setBudget] = useState({ categories: [], sections: [], payTypes: [] });
  const [checklist, setChecklist] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [exporting, setExporting] = useState(false);

  const categoryMeta = useMemo(
    () => Object.fromEntries(budget.categories.map((c) => [c.name, c])),
    [budget.categories]
  );

  const loadBudget = useCallback(async () => {
    const res = await fetch("/api/budget");
    if (res.ok) setBudget(await res.json());
  }, []);

  const loadIncome = useCallback(async () => {
    const res = await fetch("/api/income");
    if (res.ok) {
      const data = await res.json();
      setIncome(data.monthly_income);
    }
  }, []);

  const loadChecklist = useCallback(async (month) => {
    const res = await fetch(`/api/checklist?month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setChecklist(data.checklist);
    }
  }, []);

  const buildQuery = useCallback((month, f) => {
    const params = new URLSearchParams();
    params.set("month", month);
    if (f.search) params.set("search", f.search);
    if (f.category) params.set("category", f.category);
    if (f.paidBy) params.set("paidBy", f.paidBy);
    if (f.payType) params.set("payType", f.payType);
    if (f.fromDate) params.set("fromDate", f.fromDate);
    if (f.toDate) params.set("toDate", f.toDate);
    return params.toString();
  }, []);

  const loadExpenses = useCallback(
    async (month, f) => {
      const res = await fetch(`/api/expenses?${buildQuery(month, f)}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadBudget(), loadIncome()]);
      } catch {
        if (active) setError("Unable to load dashboard. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadBudget, loadIncome]);

  useEffect(() => {
    loadChecklist(monthKey);
    loadExpenses(monthKey, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, filters]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSaveIncome(amount) {
    const res = await fetch("/api/income", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly_income: amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to save. Please try again.");
    setIncome(data.monthly_income);
  }

  async function handleAddExpense(payload) {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to save expense. Please try again.");
    await loadExpenses(monthKey, filters);
  }

  async function handleUpdateExpense(id, payload) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to save expense. Please try again.");
    setEditingExpense(null);
    await loadExpenses(monthKey, filters);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const res = await fetch(`/api/expenses/${pendingDelete.id}`, { method: "DELETE" });
    if (res.ok) {
      setPendingDelete(null);
      await loadExpenses(monthKey, filters);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Unable to delete expense. Please try again.");
      setPendingDelete(null);
    }
  }

  async function handleToggleChecklist(category, isPaid) {
    setChecklist((prev) => {
      const others = prev.filter((c) => c.category !== category);
      return [...others, { category, is_paid: isPaid }];
    });
    const res = await fetch(`/api/checklist/${encodeURIComponent(category)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthKey, is_paid: isPaid }),
    });
    if (!res.ok) {
      loadChecklist(monthKey);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const res = await fetch(`/api/export?${buildQuery(monthKey, filters)}`);
      if (!res.ok) throw new Error("Unable to export. Please try again.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${monthKey}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);
  const remaining = income !== null ? income - totalSpent : null;

  const actualsByCategory = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    }
    return map;
  }, [expenses]);

  const actualsBySection = useMemo(() => {
    const map = { needs: 0, wants: 0, other: 0 };
    for (const e of expenses) {
      const section = categoryMeta[e.category]?.section;
      if (section) map[section] += Number(e.amount);
    }
    return map;
  }, [expenses, categoryMeta]);

  const totalBudget = useMemo(() => budget.sections.reduce((sum, s) => sum + s.budget, 0), [budget.sections]);

  const avgPerDay = useMemo(() => {
    const days = new Set(expenses.map((e) => e.expense_date));
    if (days.size === 0) return 0;
    return totalSpent / days.size;
  }, [expenses, totalSpent]);

  const filtersActive = Object.values(filters).some(Boolean);
  const emptyMessage =
    expenses.length === 0
      ? filtersActive
        ? "No expenses match your filters."
        : "No expenses recorded for this month."
      : "";

  if (loading) {
    return <div className="loading-screen">Loading dashboard…</div>;
  }

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>Our Expenses</h1>
        <div className="header-right">
          <span className="user-badge">{user.displayName}</span>
          <button className="link-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <MonthNavigation monthKey={monthKey} onChange={setMonthKey} />

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-row">
        <IncomeCard income={income} canEdit={user.role === "admin"} onSave={handleSaveIncome} />
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{formatMoney(totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{remaining === null ? "—" : `₹${formatMoney(remaining)}`}</div>
        </div>
      </div>

      <div className="stat-card avg-card">
        <div className="stat-label">Average Expense / Day</div>
        <div className="stat-value">₹{formatMoney(avgPerDay)}</div>
      </div>

      <div className="main-grid">
        <div className="left-column">
          <div className="card">
            {editingExpense ? (
              <ExpenseForm
                categories={budget.categories}
                payTypes={budget.payTypes}
                initialExpense={editingExpense}
                onSubmit={(payload) => handleUpdateExpense(editingExpense.id, payload)}
                onCancel={() => setEditingExpense(null)}
              />
            ) : (
              <ExpenseForm categories={budget.categories} payTypes={budget.payTypes} onSubmit={handleAddExpense} />
            )}
          </div>
        </div>

        <div className="right-column">
          <BudgetChecklist
            categories={budget.categories}
            actuals={actualsByCategory}
            checklist={checklist}
            onToggle={handleToggleChecklist}
          />
          <MonthlySummary
            sections={budget.sections}
            actualsBySection={actualsBySection}
            totalBudget={totalBudget}
            totalActual={totalSpent}
            income={income}
          />
        </div>
      </div>

      <div className="card entries-card">
        <div className="entries-header">
          <h2>Entries — {monthLabel(monthKey)}</h2>
          <button className="link-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
        <ExpenseFilters
          filters={filters}
          onChange={setFilters}
          categories={budget.categories}
          payTypes={budget.payTypes}
          users={PUBLIC_USERS}
        />
        <ExpenseList
          expenses={expenses}
          categoryMeta={categoryMeta}
          emptyMessage={emptyMessage}
          onEdit={setEditingExpense}
          onDelete={setPendingDelete}
        />
      </div>

      {pendingDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete this expense?</h3>
            <p>
              {pendingDelete.description || pendingDelete.category} — ₹{formatMoney(pendingDelete.amount)}
            </p>
            <div className="modal-actions">
              <button onClick={confirmDelete}>Delete</button>
              <button className="btn-secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
