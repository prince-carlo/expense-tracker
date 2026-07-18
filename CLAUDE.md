# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Architecture

This is a single-page React 19 + Vite app with **no routing**. `App.jsx` owns the top-level `transactions` state and composes three presentational/stateful child components (`src/Summary.jsx`, `src/TransactionForm.jsx`, `src/TransactionList.jsx`) — it no longer contains totals, form, or table markup itself.

### Components

| Component | Props in | Owns locally | Emits |
|---|---|---|---|
| `App.jsx` | — | `transactions` | — |
| `Summary.jsx` | `transactions` | — (derives totals each render) | — |
| `TransactionForm.jsx` | `categories`, `onAddTransaction` | `description`, `amount`, `type`, `category` (form fields) | calls `onAddTransaction(newTransaction)` on submit, then resets its own fields |
| `TransactionList.jsx` | `transactions`, `categories`, `onDeleteTransaction` | `filterType`, `filterCategory` | calls `onDeleteTransaction(id)` when a row's delete button is confirmed |

### State

- `App.jsx`: `transactions` — array of `{ id, description, amount, type, category, date }`.
- `TransactionForm.jsx`: `description`, `amount`, `type`, `category` — controlled form inputs (local to the form; not lifted to `App.jsx`).
- `TransactionList.jsx`: `filterType`, `filterCategory` — control which transactions are shown in the table (local to the list; not lifted to `App.jsx`).

### Data flow

1. Eight hardcoded transactions seed `App.jsx`'s initial state.
2. `Summary` derives `totalIncome`, `totalExpenses`, and `balance` via `reduce()` from the `transactions` prop.
3. `TransactionList` filters by `filterType` and `filterCategory` (AND logic) before rendering.
4. Submitting `TransactionForm` builds a new transaction (using `Date.now()` as id), calls `onAddTransaction` to append it in `App.jsx`, and resets its own form fields.
5. Clicking a row's delete button in `TransactionList` shows a `window.confirm` prompt; on confirmation it calls `onDeleteTransaction(id)`, which `App.jsx` handles by filtering that transaction out of state.

### Known intentional issues (per README — this is a course starter)

- `amount` is stored and reduced as a **string**, causing string concatenation instead of numeric addition in the summary totals.
- No data persistence — state resets on page refresh.

### Styling

Custom CSS only (`src/App.css`, `src/index.css`). No UI library. Max-width 800px centered layout.
