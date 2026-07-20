import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useOnlineStatus } from './useOnlineStatus'
import {
  getQueue,
  setQueue as persistQueue,
  getCache,
  setCache,
  applyQueueToList,
} from './offlineStore'
import Summary from './Summary'
import CategoryChart from './CategoryChart'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import './App.css'

function isNetworkError(err) {
  return err instanceof TypeError || /fetch|network/i.test(err?.message || '')
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueueState] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const isOnline = useOnlineStatus();
  const transactionsRef = useRef(transactions);
  const queueRef = useRef(queue);
  const isSyncingRef = useRef(false);

  useEffect(() => { transactionsRef.current = transactions }, [transactions]);
  useEffect(() => { queueRef.current = queue }, [queue]);

  const categories = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"];

  const flushQueue = useCallback(async () => {
    if (isSyncingRef.current || queueRef.current.length === 0) return;
    isSyncingRef.current = true;
    setSyncing(true);
    setError(null);

    const tempIdMap = {};
    let working = transactionsRef.current;

    while (queueRef.current.length > 0) {
      const op = queueRef.current[0];
      try {
        if (op.type === 'create') {
          const { data, error } = await supabase
            .from('transactions')
            .insert(op.payload)
            .select()
            .single();
          if (error) throw error;
          tempIdMap[op.tempId] = data.id;
          working = working.map((t) => (t.id === op.tempId ? data : t));
          setTransactions(working);
        } else if (op.type === 'delete') {
          const resolvedId = tempIdMap[op.id] ?? op.id;
          const { error } = await supabase.from('transactions').delete().eq('id', resolvedId);
          if (error) throw error;
        }
      } catch (err) {
        setError(`Sync paused — will retry when back online (${err.message})`);
        break;
      }

      const nextQueue = queueRef.current.slice(1);
      queueRef.current = nextQueue;
      setQueueState(nextQueue);
      await persistQueue(nextQueue);
    }

    transactionsRef.current = working;
    await setCache(working);
    isSyncingRef.current = false;
    setSyncing(false);
  }, []);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const storedQueue = await getQueue();
      if (ignore) return;
      queueRef.current = storedQueue;
      setQueueState(storedQueue);

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        if (error) throw error;
        if (ignore) return;

        transactionsRef.current = data;
        setTransactions(applyQueueToList(data, storedQueue));
        await setCache(data);
      } catch (err) {
        if (ignore) return;
        const cached = await getCache();
        if (cached) {
          transactionsRef.current = cached;
          setTransactions(applyQueueToList(cached, storedQueue));
        } else {
          setError(err.message);
        }
      }

      if (!ignore) setLoading(false);
      if (navigator.onLine && storedQueue.length > 0) flushQueue();
    })();

    return () => { ignore = true };
  }, [flushQueue]);

  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline, flushQueue]);

  const queueCreate = (payload) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const nextQueue = [...queueRef.current, { opId: crypto.randomUUID(), type: 'create', tempId, payload }];
    queueRef.current = nextQueue;
    setQueueState(nextQueue);
    persistQueue(nextQueue);

    const next = [{ ...payload, id: tempId, _pending: true }, ...transactionsRef.current];
    transactionsRef.current = next;
    setTransactions(next);
  };

  const queueDelete = (id) => {
    const nextQueue = [...queueRef.current, { opId: crypto.randomUUID(), type: 'delete', id }];
    queueRef.current = nextQueue;
    setQueueState(nextQueue);
    persistQueue(nextQueue);
  };

  const handleAddTransaction = async (newTransaction) => {
    setError(null);

    if (!navigator.onLine) {
      queueCreate(newTransaction);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single();
      if (error) throw error;

      const next = [data, ...transactionsRef.current];
      transactionsRef.current = next;
      setTransactions(next);
      await setCache(next);
    } catch (err) {
      if (isNetworkError(err)) {
        queueCreate(newTransaction);
      } else {
        setError(err.message);
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    setError(null);

    const isPendingCreate = queueRef.current.some((op) => op.type === 'create' && op.tempId === id);
    if (isPendingCreate) {
      const nextQueue = queueRef.current.filter((op) => !(op.type === 'create' && op.tempId === id));
      queueRef.current = nextQueue;
      setQueueState(nextQueue);
      await persistQueue(nextQueue);

      const next = transactionsRef.current.filter((t) => t.id !== id);
      transactionsRef.current = next;
      setTransactions(next);
      return;
    }

    const previous = transactionsRef.current;
    const next = previous.filter((t) => t.id !== id);
    transactionsRef.current = next;
    setTransactions(next);

    if (!navigator.onLine) {
      queueDelete(id);
      return;
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await setCache(next);
    } catch (err) {
      if (isNetworkError(err)) {
        queueDelete(id);
      } else {
        setError(err.message);
        transactionsRef.current = previous;
        setTransactions(previous);
      }
    }
  };

  const statusText = !isOnline
    ? 'Offline — tracking locally'
    : syncing
      ? `Syncing ${queue.length} change${queue.length === 1 ? '' : 's'}…`
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

      {isOnline && !syncing && queue.length > 0 && (
        <p className="sync-banner">{queue.length} change{queue.length === 1 ? '' : 's'} waiting to sync…</p>
      )}

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
