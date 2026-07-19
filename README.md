# Finance Tracker

> Originally the starter project for my [Claude Code course](https://codewithmosh.com/p/claude-code) — a deliberately rough expense tracker (bug, poor UI, messy code) that gets fixed up over the course. Since then it's grown into a small but real app: a redesigned UI and a Supabase backend for persistence.

A single-page app for logging income and expenses, seeing where money goes by category, and keeping a running balance — all backed by a real Postgres database instead of state that resets on refresh.

## Workflow

1. **See where you stand.** The summary panel shows total income, total expenses, and balance at a glance.
2. **See where it's going.** The spending-by-category chart breaks down expenses (housing, food, utilities, transport, entertainment, salary, other) as a sorted bar chart.
3. **Record an entry.** The form takes a description, amount, type (income/expense), and category, and saves it straight to the database.
4. **Browse and filter.** The transactions table lists every entry, newest first, filterable by type and category.
5. **Delete an entry.** Each row has a delete button (with a confirmation prompt) that removes it from the database.

All of this reads from and writes to a `transactions` table in Supabase, so data persists across refreshes and devices — it isn't just local component state.

## Tech stack

- **[React 19](https://react.dev/)** + **[Vite 7](https://vitejs.dev/)** — UI and dev/build tooling, no router (single page).
- **[Supabase](https://supabase.com/)** (Postgres + auto-generated REST API) — the `transactions` table, accessed client-side via `@supabase/supabase-js`. Row Level Security is enabled with public read/write policies (no auth yet — fine for local/demo use).
- **[Recharts](https://recharts.org/)** — the spending-by-category bar chart.
- **Plain CSS** (`src/App.css`, `src/index.css`) — no UI library; custom dark, terminal-inspired theme.
- **ESLint** — the project's correctness gate (`npm run lint`); there's no test suite yet.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Create a free project at [supabase.com](https://supabase.com), then run this in its SQL Editor:

```sql
create table transactions (
  id bigint generated always as identity primary key,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Public can read transactions"
  on transactions for select
  using (true);

create policy "Public can insert transactions"
  on transactions for insert
  with check (true);

create policy "Public can delete transactions"
  on transactions for delete
  using (true);
```

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your project's URL and publishable key (Project Settings → API):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

### 4. Run it

```bash
npm run dev
```

Then open `http://localhost:5173`.

## Known intentional issues

- `amount` is stored and summed as a **string**, so totals are string concatenation, not numeric addition — left in on purpose as a teaching bug.
- Database access uses fully public RLS policies with no authentication, so anyone with the publishable key can read or write the table. Fine for local/demo use; would need real auth before deploying anywhere public.
