# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

Requires `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.local.example`) — the app throws on load without them.

## Architecture

This is a single-page React 19 + Vite app with **no routing**, backed by a Supabase Postgres `transactions` table (see `src/supabaseClient.js`). `App.jsx` owns the top-level `transactions` state, loads it from Supabase on mount, and composes three presentational/stateful child components (`src/Summary.jsx`, `src/TransactionForm.jsx`, `src/TransactionList.jsx`) — it no longer contains totals, form, or table markup itself.

### Components

| Component | Props in | Owns locally | Emits |
|---|---|---|---|
| `App.jsx` | — | `transactions` | — |
| `Summary.jsx` | `transactions` | — (derives totals each render) | — |
| `TransactionForm.jsx` | `categories`, `onAddTransaction` | `description`, `amount`, `type`, `category` (form fields) | calls `onAddTransaction(newTransaction)` on submit, then resets its own fields |
| `TransactionList.jsx` | `transactions`, `categories`, `onDeleteTransaction` | `filterType`, `filterCategory` | calls `onDeleteTransaction(id)` when a row's delete button is confirmed |

### State

- `App.jsx`: `transactions` — array of `{ id, description, amount, type, category, date }`, plus `loading` and `error` for the Supabase round trip.
- `TransactionForm.jsx`: `description`, `amount`, `type`, `category` — controlled form inputs (local to the form; not lifted to `App.jsx`).
- `TransactionList.jsx`: `filterType`, `filterCategory` — control which transactions are shown in the table (local to the list; not lifted to `App.jsx`).

### Data flow

1. On mount, `App.jsx` fetches all rows from the Supabase `transactions` table (newest `date` first) into state.
2. `Summary` derives `totalIncome`, `totalExpenses`, and `balance` via `reduce()` from the `transactions` prop.
3. `TransactionList` filters by `filterType` and `filterCategory` (AND logic) before rendering.
4. Submitting `TransactionForm` builds a new transaction (no `id` — the database assigns one), calls `onAddTransaction`, which inserts it into Supabase and prepends the returned row (with its DB-generated `id`) to state; the form then resets its own fields regardless of the request's outcome.
5. Clicking a row's delete button in `TransactionList` shows a `window.confirm` prompt; on confirmation it calls `onDeleteTransaction(id)`, which `App.jsx` handles by optimistically removing it from state, deleting it in Supabase, and rolling the state back if that call fails.
6. Any Supabase error (fetch, insert, or delete) is surfaced via the `error` state as a banner at the top of the page.

### Known intentional issues (per README — this is a course starter)

- `amount` is stored and reduced as a **string**, causing string concatenation instead of numeric addition in the summary totals.
- The Supabase `transactions` table has row level security enabled but with fully public policies (no auth) — fine for local/demo use, not for a real multi-user deployment.

### Styling

Custom CSS only (`src/App.css`, `src/index.css`). No UI library. Max-width 800px centered layout.
