import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";

export const initializeBalances = (members) => {
  const balances = {};

  members.forEach((member) => {
    balances[member._id.toString()] = {
      user: {
        _id: member._id,
        fullName: member.fullName,
        email: member.email,
      },
      paid: 0,
      owes: 0,
      balance: 0,
    };
  });

  return balances;
};

export const addPayment = (balances, paidBy, amount) => {
  const key = paidBy.toString();

  if (!balances[key]) {
    console.log("Payer not found in balances:", key);
    return;
  }

  balances[key].paid += amount;
};

export const addOwedAmount = (balances, participants) => {
  participants.forEach((participant) => {
    const key = participant.user.toString();

    if (!balances[key]) {
      console.log("Participant not found in balances:", key);
      return;
    }

    balances[key].owes += participant.amount;
  });
};

export const calculateFinalBalances = (balances) => {
  Object.values(balances).forEach((user) => {
    user.balance = Number((user.paid - user.owes).toFixed(2));
  });

  return Object.values(balances);
};

export const calculateDirectDebts = (expenses) => {
  const debts = {};

  expenses.forEach((expense) => {
    const payer = expense.paidBy.toString();

    expense.participants.forEach((participant) => {
      const debtor = participant.user.toString();
      const amount = Number(participant.amount);

      if (debtor === payer || amount <= 0) return;

      const forwardKey = `${debtor}_${payer}`;
      const reverseKey = `${payer}_${debtor}`;

      if (debts[reverseKey]) {
        if (debts[reverseKey] >= amount) {
          debts[reverseKey] -= amount;
        } else {
          const remaining = amount - debts[reverseKey];

          delete debts[reverseKey];

          debts[forwardKey] = (debts[forwardKey] || 0) + remaining;
        }
      } else {
        debts[forwardKey] = (debts[forwardKey] || 0) + amount;
      }
    });
  });

  return Object.entries(debts)
    .filter(([_, amount]) => amount > 0.01)
    .map(([key, amount]) => {
      const [from, to] = key.split("_");

      return {
        from,
        to,
        amount: Number(amount.toFixed(2)),
      };
    });
};
