export const calculateNetBalances = (expenses) => {
  const balances = {}; // { userId: netBalance }

  expenses.forEach((expense) => {
    const payer = expense.paidBy.toString();
    const totalAmount = expense.amount;

    // 1. Credit the payer
    balances[payer] = (balances[payer] || 0) + totalAmount;

    // 2. Debit the participants
    expense.splitDetails.forEach((split) => {
      const ower = split.user.toString();
      balances[ower] = (balances[ower] || 0) - split.amountOwed;
    });
  });

  return balances;
};

export const simplifyDebts = (netBalances) => {
  const debtors = [];
  const creditors = [];

  for (const [user, amount] of Object.entries(netBalances)) {
    if (amount < 0) debtors.push({ user, amount: Math.abs(amount) });
    else if (amount > 0) creditors.push({ user, amount });
  }

  const transactions = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settlementAmount = Math.min(debtors[i].amount, creditors[j].amount);

    transactions.push({
      from: debtors[i].user,
      to: creditors[j].user,
      amount: settlementAmount.toFixed(2),
    });

    debtors[i].amount -= settlementAmount;
    creditors[j].amount -= settlementAmount;

    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return transactions;
};
