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

This is a single-page React 19 + Vite app with **no routing**, backed by a Supabase Postgres `transactions` table (see `src/lib/supabaseClient.js`), installable as a PWA (`vite-plugin-pwa`, configured in `vite.config.js`). `App.jsx` is purely presentational: it calls `useTransactions()` (`src/hooks/useTransactions.js`) for all state/data logic and composes four presentational child components from `src/components/` (`Summary.jsx`, `CategoryChart.jsx`, `TransactionForm.jsx`, `TransactionList.jsx`) plus status banners driven by the hook's return values.

### Folder structure

- `src/components/` — the four child components listed above.
- `src/hooks/` — `useOnlineStatus.js` (wraps `navigator.onLine` + `online`/`offline` events); `useTransactions.js` (see below).
- `src/lib/` — non-UI logic: `supabaseClient.js`, `offlineStore.js` (IndexedDB-backed offline write queue + read cache, via `idb-keyval`), `categoryColors.js`.
- `App.jsx`, `main.jsx`, `App.css`, `index.css` stay at `src/` root.

### `useTransactions` hook

`src/hooks/useTransactions.js` owns everything about the transactions list and offline sync, returning `{ transactions, loading, error, isOnline, syncing, pendingCount, addTransaction, deleteTransaction }`. `App.jsx` only consumes that return value — no `useState`/`useEffect` of its own.

1. On mount, it loads the persisted offline queue, then fetches all rows from Supabase (newest `date` first). On success the fetched rows are cached to IndexedDB (`lib/offlineStore.js`) and merged with any still-queued mutations; on failure (offline) it falls back to the last cached snapshot merged the same way.
2. `addTransaction`: online, inserts into Supabase and prepends the returned row to state. Offline (or on a network error), it instead assigns a temp id, marks the row `_pending`, and queues a `create` op in IndexedDB.
3. `deleteTransaction`: for a synced row, optimistically removes it from state, then deletes in Supabase (or queues a `delete` op if offline/network-fails, rolling back only on a *non*-network error). For a still-`_pending` row, it just cancels its queued `create` op locally — no network call.
4. Whenever the app comes online (or on mount, if already online), the internal `flushQueue` replays the queue against Supabase in order, resolving temp ids to real DB ids, and re-caches the result.
5. Any non-network Supabase error is surfaced via `error`.

### Components

| Component | Props in | Owns locally | Emits |
|---|---|---|---|
| `App.jsx` | — | — (all state comes from `useTransactions()`) | — |
| `Summary.jsx` | `transactions` | — (derives totals each render) | — |
| `CategoryChart.jsx` | `transactions` | — (derives per-category totals each render) | — |
| `TransactionForm.jsx` | `categories`, `onAddTransaction` | `description`, `amount`, `type`, `category` (form fields) | calls `onAddTransaction(newTransaction)` on submit, then resets its own fields |
| `TransactionList.jsx` | `transactions`, `categories`, `onDeleteTransaction` | `filterType`, `filterCategory` | calls `onDeleteTransaction(id)` when a row's delete button is confirmed (or immediately, no confirm, for a still-`_pending` unsynced row) |

### State

- `useTransactions()`: `transactions` — array of `{ id, description, amount, type, category, date }` (rows not yet synced carry a temp `id` and `_pending: true`), plus `loading`, `error`, `queue` (pending offline mutations, exposed as `pendingCount`), and `syncing`.
- `TransactionForm.jsx`: `description`, `amount`, `type`, `category` — controlled form inputs (local to the form; not lifted up).
- `TransactionList.jsx`: `filterType`, `filterCategory` — control which transactions are shown in the table (local to the list; not lifted up).

### Data flow

1. `TransactionList` filters by `filterType` and `filterCategory` (AND logic) before rendering.
2. `Summary` derives `totalIncome`, `totalExpenses`, and `balance`; `CategoryChart` derives per-category expense totals — both via `reduce()` from the `transactions` prop.
3. All mutation and sync flow is described under **`useTransactions` hook** above.

### Known intentional issues (per README — this is a course starter)

- The Supabase `transactions` table has row level security enabled but with fully public policies (no auth) — fine for local/demo use, not for a real multi-user deployment.

### Styling

Custom CSS only (`src/App.css`, `src/index.css`). No UI library. Max-width 800px centered layout.
