import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";

import {
  initializeBalances,
  addPayment,
  addOwedAmount,
  calculateFinalBalances,
} from "../utils/balance.utils.js";

export const calculateBalances = async (groupId) => {
  console.log("Group ID:", groupId);

  const group = await Group.findById(groupId).populate(
    "members",
    "fullName email",
  );

  if (!group) {
    throw new Error("Group not found");
  }

  const expenses = await Expense.find({
    group: groupId,
  });

  const settlements = await Settlement.find({
    group: groupId,
    status: "completed",
  });

  const balances = initializeBalances(group.members);

  expenses.forEach((expense) => {
    addPayment(balances, expense.paidBy, Number(expense.amount));

    addOwedAmount(balances, expense.participants);
  });

  settlements.forEach((settlement) => {
    const payer = settlement.payer.toString();
    const receiver = settlement.receiver.toString();
    const amount = Number(settlement.amount);

    // Payer paid receiver
    balances[payer].paid += amount;
    balances[receiver].paid -= amount;
  });

  return calculateFinalBalances(balances);
};
