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

  let amountOwed = 0;

  const payer = payerId.toString();
  const receiver = receiverId.toString();

  expenses.forEach((expense) => {
    const paidBy = expense.paidBy.toString();

    expense.participants.forEach((participant) => {
      const participantId = participant.user.toString();
      const participantAmount = Number(participant.amount);

      if (paidBy === receiver && participantId === payer) {
        amountOwed += participantAmount;
      }

      if (paidBy === payer && participantId === receiver) {
        amountOwed -= participantAmount;
      }
    });
  });

  settlements.forEach((settlement) => {
    const settlementPayer = settlement.payer.toString();

    const settlementReceiver = settlement.receiver.toString();

    const settlementAmount = Number(settlement.amount);

    if (settlementPayer === payer && settlementReceiver === receiver) {
      amountOwed -= settlementAmount;
    }
    if (settlementPayer === receiver && settlementReceiver === payer) {
      amountOwed += settlementAmount;
    }
  });

  return Math.max(0, Number(amountOwed.toFixed(2)));
};
