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

This is a single-page React 19 + Vite app with **no routing and no sub-components** — all logic lives in `src/App.jsx`.

### State

Nine `useState` variables in `App.jsx`:
- `transactions` — array of `{ id, description, amount, type, category, date }`
- `description`, `amount`, `type`, `category` — controlled form inputs for adding a transaction
- `filterType`, `filterCategory` — control which transactions are shown in the table

### Data flow

1. Eight hardcoded transactions seed the initial state.
2. Summary totals (`totalIncome`, `totalExpenses`, `balance`) are derived inline via `reduce()`.
3. The transaction list is filtered by `filterType` and `filterCategory` (AND logic) before rendering.
4. Submitting the form appends a new transaction (using `Date.now()` as id) and resets form fields.

### Known intentional issues (per README — this is a course starter)

- `amount` is stored and reduced as a **string**, causing string concatenation instead of numeric addition in the summary totals.
- A `delete-btn` CSS class exists but no delete button is rendered.
- No data persistence — state resets on page refresh.

### Styling

Custom CSS only (`src/App.css`, `src/index.css`). No UI library. Max-width 800px centered layout.
