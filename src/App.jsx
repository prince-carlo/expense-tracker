import { useTransactions } from './hooks/useTransactions'
import Summary from './components/Summary'
import CategoryChart from './components/CategoryChart'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import './App.css'

const CATEGORIES = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"];

function App() {
  const {
    transactions,
    loading,
    error,
    isOnline,
    syncing,
    pendingCount,
    addTransaction,
    deleteTransaction,
  } = useTransactions();

  const statusText = !isOnline
    ? 'Offline — tracking locally'
    : syncing
      ? `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}…`
      : 'System online — tracking active';

  return (
    <div className="app">
      <header className="app-header">
        <h1>Finance Tracker</h1>
        <p className={`subtitle${!isOnline ? ' subtitle-offline' : ''}`}>{statusText}</p>
      </header>

      {error && <p className="error-banner">{error}</p>}

      {!isOnline && (
        <p className="offline-banner">
          You&rsquo;re offline. Entries you add or delete now are saved locally and will sync automatically once you&rsquo;re back online.
        </p>
      )}

      {isOnline && !syncing && pendingCount > 0 && (
        <p className="sync-banner">{pendingCount} change{pendingCount === 1 ? '' : 's'} waiting to sync…</p>
      )}

      {loading ? (
        <p className="empty-state">Loading transactions…</p>
      ) : (
        <>
          <Summary transactions={transactions} />
          <CategoryChart transactions={transactions} />
          <TransactionForm categories={CATEGORIES} onAddTransaction={addTransaction} />
          <TransactionList transactions={transactions} categories={CATEGORIES} onDeleteTransaction={deleteTransaction} />
        </>
      )}
    </div>
  );
}

export default App
