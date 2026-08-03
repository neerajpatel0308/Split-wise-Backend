import Expense from "../models/Expense.js";
import Group from "../models/Group.js";

import {
  initializeBalances,
  addPayment,
  addOwedAmount,
  calculateFinalBalances,
} from "../utils/balance.utils.js";

export const calculateBalances = async (groupId) => {
  const group = await Group.findById(groupId).populate(
    "members",
    "fullName email",
  );

  if (!group) {
    throw new Error("Group not found");
  }

  const expenses = await Expense.find({ group: groupId });

  const balances = initializeBalances(group.members);

  expenses.forEach((expense) => {
    console.log("Expense:", expense);
    addPayment(balances, expense.paidBy, expense.amount);

    addOwedAmount(balances, expense.participants);
  });

  return calculateFinalBalances(balances);
};
