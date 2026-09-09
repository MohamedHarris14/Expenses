-- Run this once against your Vercel Postgres database before first use.
-- Safe to re-run: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Monthly income is a single stored setting, never an expense transaction.
CREATE TABLE IF NOT EXISTS monthly_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    monthly_income NUMERIC(12,2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT monthly_settings_single_row CHECK (id = 1)
);

INSERT INTO monthly_settings (id, monthly_income)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    paid_by VARCHAR(50) NOT NULL,
    pay_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses (paid_by);

CREATE TABLE IF NOT EXISTS budget_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_key VARCHAR(7) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (month_key, category)
);

CREATE INDEX IF NOT EXISTS idx_budget_checklist_month ON budget_checklist (month_key);

-- Note: user credentials are intentionally hardcoded in lib/auth.js
-- (server-only) rather than stored in a `users` table, per the app's
-- lightweight-auth design. `paid_by` on expenses stores the username
-- string directly rather than a foreign key.
