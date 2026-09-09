# Our Expenses

A private household expense tracker for two people (Harris, admin; Joe, member), built with:

- React (via Next.js App Router)
- Server-side API routes for auth, validation, and database access
- PostgreSQL for all permanent data (Vercel Postgres in production)
- GitHub for source control, Vercel for hosting

The browser never talks to Postgres directly, never sees the database
connection string, and never sees anyone's password.

---

## 1. How it's put together

```
expenses-app/
├── app/
│   ├── page.jsx              → dashboard (redirects to /login if not signed in)
│   ├── login/page.jsx        → login page
│   └── api/                  → server-side API routes (auth, expenses, income, budget, checklist, export)
├── components/                → React UI (all client components)
├── lib/
│   ├── auth.js                → SERVER-ONLY hardcoded credentials
│   ├── session.js              → signed-cookie session (create/read/destroy)
│   ├── db.js                   → Postgres connection (DATABASE_URL)
│   ├── budget.js                → fixed category/budget configuration
│   ├── expense-query.js          → shared parameterized filter builder
│   ├── csv.js                     → CSV export formatting
│   ├── format.js                   → client-safe display formatting
│   └── users-public.js              → client-safe display usernames (no secrets)
└── db/schema.sql               → run this once against your database
```

### Why there's no `users` table

Credentials are intentionally hardcoded in `lib/auth.js` (server-only,
never imported by anything client-side) rather than stored in the
database — this is a lightweight two-person app, not a general auth
system. `expenses.paid_by` stores the username as plain text rather than
a foreign key.

### Sessions

There's no `sessions` table either. Login issues an `httpOnly` cookie
containing `{ username, role, displayName }`, signed with HMAC-SHA256
using `SESSION_SECRET`. The server verifies the signature on every
protected request, so the browser can't forge or read the session
contents, and `paid_by` / permission checks always come from this
verified session — never from anything the client sends in a request
body.

---

## 2. Local development

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_random_session_secret
```

Generate a session secret with `openssl rand -base64 32` (or any long
random string).

Then create the tables (run once, against your database):

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000 — log in as `Harris` / `1405` or `Joe` / `1405`.

---

## 3. GitHub setup

```bash
git init
git add .
git commit -m "Initial expenses app"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

`.env.local`, `DATABASE_URL`, `SESSION_SECRET`, and `node_modules` are
already covered by `.gitignore` — they are never pushed.

---

## 4. Vercel deployment

1. Push this project to GitHub (above).
2. In Vercel, **Import** the GitHub repository.
3. Add a Postgres database: **Storage → Create Database → Postgres**
   (or connect an existing one) and attach it to this project.
4. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
     (if Vercel's integration gave you `POSTGRES_URL` instead, copy that
     value into a `DATABASE_URL` variable too, since this app reads
     `DATABASE_URL` specifically)
   - `SESSION_SECRET` — a long random string
5. Deploy.
6. Run `db/schema.sql` against the production database once (e.g. via
   `vercel env pull .env.local` locally, then `psql "$DATABASE_URL" -f db/schema.sql`,
   or through your Postgres provider's SQL console).
7. Open the production URL and test:
   - Log in as Harris
   - Log in as Joe
   - Add an expense as each user
   - Confirm Joe cannot edit income (button doesn't appear; `PUT /api/income` returns 403)
   - Refresh the browser and confirm data persists

---

## 5. Manual test checklist

**Persistence**
- [ ] Add an expense, refresh the browser → it's still there
- [ ] Log out, log back in → it's still there
- [ ] Open the app in a different browser/device → same data appears
- [ ] Update income as Harris, log out/in → updated value persists
- [ ] Mark a category paid, switch months, come back → still checked

**Permissions**
- [ ] Harris: login, view/add/edit/delete expenses, view/update income, update checklist, export CSV
- [ ] Joe: login, view/add/edit/delete expenses, view income (read-only), update checklist, export CSV
- [ ] Joe calling `PUT /api/income` directly → `403 Forbidden`

---

## 6. Notes on the budget configuration

`lib/budget.js` holds category icons, sections (Needs/Wants/Other), and
monthly budget amounts — this is static app configuration and is not
stored in the database, per the project design. Insurance and WiFi are
modeled as sinking funds: billed every 3 months, with the dashboard
using the monthly-equivalent amount (`billedAmount / billedEvery`) for
budget math. Edit the numbers in `BUDGET_AMOUNTS` and the `billedEvery` /
`billedAmount` fields to match your actual household budget.
