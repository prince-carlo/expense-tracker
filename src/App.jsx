import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Summary from './Summary'
import CategoryChart from './CategoryChart'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import './App.css'

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"];

  useEffect(() => {
    let ignore = false;

    supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) {
          setError(error.message);
        } else {
          setTransactions(data);
        }
        setLoading(false);
      });

    return () => { ignore = true };
  }, []);

  const handleAddTransaction = async (newTransaction) => {
    setError(null);
    const { data, error } = await supabase
      .from('transactions')
      .insert(newTransaction)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setTransactions(prev => [data, ...prev]);
  };

  const handleDeleteTransaction = async (id) => {
    setError(null);
    const previous = transactions;
    setTransactions(transactions.filter(t => t.id !== id));

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      setError(error.message);
      setTransactions(previous);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Finance Tracker</h1>
        <p className="subtitle">System online — tracking active</p>
      </header>

      {error && <p className="error-banner">{error}</p>}

      {loading ? (
        <p className="empty-state">Loading transactions…</p>
      ) : (
        <>
          <Summary transactions={transactions} />
          <CategoryChart transactions={transactions} />
          <TransactionForm categories={categories} onAddTransaction={handleAddTransaction} />
          <TransactionList transactions={transactions} categories={categories} onDeleteTransaction={handleDeleteTransaction} />
        </>
      )}
    </div>
  );
}

export default App
