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

  // Calculate debt created by expenses
  expenses.forEach((expense) => {
    const paidBy = expense.paidBy.toString();

    expense.participants.forEach((participant) => {
      const participantId = participant.user.toString();
      const participantAmount = Number(participant.amount);

      // Payer owes Receiver
      if (
        paidBy === receiverId.toString() &&
        participantId === payerId.toString()
      ) {
        amountOwed += participantAmount;
      }

      // Receiver owes Payer
      if (
        paidBy === payerId.toString() &&
        participantId === receiverId.toString()
      ) {
        amountOwed -= participantAmount;
      }
    });
  });

  // Apply previous settlements
  settlements.forEach((settlement) => {
    const settlementPayer = settlement.payer.toString();
    const settlementReceiver = settlement.receiver.toString();
    const settlementAmount = Number(settlement.amount);

    // Payer already paid Receiver
    if (
      settlementPayer === payerId.toString() &&
      settlementReceiver === receiverId.toString()
    ) {
      amountOwed -= settlementAmount;
    }

    // Receiver already paid Payer
    if (
      settlementPayer === receiverId.toString() &&
      settlementReceiver === payerId.toString()
    ) {
      amountOwed += settlementAmount;
    }
  });

  return Math.max(0, Number(amountOwed.toFixed(2)));
};
