// Initialize balance map for all group members
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

// Add payment made by expense creator
export const addPayment = (balances, paidBy, amount) => {
  balances[paidBy.toString()].paid += amount;
};

// Add amount owed by each participant
export const addOwedAmount = (balances, participants) => {
  participants.forEach((participant) => {
    balances[participant.user.toString()].owes += participant.amount;
  });
};

// Calculate final balance
export const calculateFinalBalances = (balances) => {
  Object.values(balances).forEach((user) => {
    user.balance = Number((user.paid - user.owes).toFixed(2));
  });

  return Object.values(balances);
};
