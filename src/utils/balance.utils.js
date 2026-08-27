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

export const calculatePairwiseDebt = async (groupId, payerId, receiverId) => {
  const expenses = await Expense.find({
    group: groupId,
  });

  const settlements = await Settlement.find({
    group: groupId,
    status: "completed",
  });

  const payer = payerId.toString();
  const receiver = receiverId.toString();

  const balances = {};

  // Calculate balances from expenses
  expenses.forEach((expense) => {
    const paidBy = expense.paidBy.toString();
    const totalAmount = Number(expense.amount);

    balances[paidBy] = (balances[paidBy] || 0) + totalAmount;

    expense.participants.forEach((participant) => {
      const userId = participant.user.toString();
      const amount = Number(participant.amount);

      balances[userId] = (balances[userId] || 0) - amount;
    });
  });

  // Apply completed settlements
  settlements.forEach((settlement) => {
    const settlementPayer = settlement.payer.toString();
    const settlementReceiver = settlement.receiver.toString();
    const amount = Number(settlement.amount);

    balances[settlementPayer] = (balances[settlementPayer] || 0) + amount;

    balances[settlementReceiver] = (balances[settlementReceiver] || 0) - amount;
  });

  const payerBalance = Number((balances[payer] || 0).toFixed(2));
  const receiverBalance = Number((balances[receiver] || 0).toFixed(2));

  // Payer must owe money and receiver must be owed money
  if (payerBalance >= 0 || receiverBalance <= 0) {
    return 0;
  }

  const amountOwed = Math.min(Math.abs(payerBalance), receiverBalance);

  return Number(amountOwed.toFixed(2));
};
