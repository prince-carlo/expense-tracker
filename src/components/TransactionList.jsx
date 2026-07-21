import { useState } from 'react'
import { CATEGORY_COLORS, FALLBACK_CATEGORY_COLOR } from '../lib/categoryColors'

function TransactionList({ transactions, categories, onDeleteTransaction }) {
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  let filteredTransactions = transactions;
  if (filterType !== "all") {
    filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
  }
  if (filterCategory !== "all") {
    filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
  }

  return (
    <div className="transactions">
      <h2>Transactions</h2>
      <div className="filters">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="empty-state">
          {transactions.length === 0
            ? "No entries yet — record one above to start your ledger."
            : "No entries match these filters."}
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t, i) => (
                <tr
                  key={t.id}
                  className={t._pending ? 'tx-pending' : undefined}
                  style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                >
                  <td className="cell-date">{t.date}</td>
                  <td>
                    {t.description}
                    {t._pending && <span className="pending-badge">pending sync</span>}
                  </td>
                  <td>
                    <span
                      className="category-chip"
                      style={{
                        color: CATEGORY_COLORS[t.category] || FALLBACK_CATEGORY_COLOR,
                        borderColor: CATEGORY_COLORS[t.category] || FALLBACK_CATEGORY_COLOR,
                      }}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className={t.type === "income" ? "income-amount" : "expense-amount"}>
                    {t.type === "income" ? "+" : "-"}${t.amount}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => {
                        if (t._pending || window.confirm("Delete this transaction?")) {
                          onDeleteTransaction(t.id);
                        }
                      }}
                    >
                      {t._pending ? 'Cancel' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionList
