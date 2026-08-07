import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

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

  console.log("Group:", group);

  if (!group) {
    throw new Error("Group not found");
  }

  const expenses = await Expense.find({ group: groupId });

  console.log("Expenses:", expenses);

  const balances = initializeBalances(group.members);

  console.log("Initial Balances:", balances);

  expenses.forEach((expense) => {
    console.log("Expense:", expense);

    addPayment(balances, expense.paidBy, expense.amount);
    addOwedAmount(balances, expense.participants);
  });

  return calculateFinalBalances(balances);
};
