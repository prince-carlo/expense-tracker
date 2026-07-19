function Summary({ transactions }) {
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="summary">
      <div className="summary-card">
        <span className="summary-label">Income</span>
        <p className="income-amount">${totalIncome}</p>
      </div>
      <div className="summary-card">
        <span className="summary-label">Expenses</span>
        <p className="expense-amount">${totalExpenses}</p>
      </div>
      <div className="summary-card">
        <span className="summary-label">Balance</span>
        <p className="balance-amount">${balance}</p>
      </div>
    </div>
  );
}

export default Summary
