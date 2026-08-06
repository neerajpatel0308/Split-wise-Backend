import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

export const getDashboardSummary = async (userId) => {
  // Get all groups of logged-in user
  const groups = await Group.find({
    members: userId,
  });

  const groupIds = groups.map((group) => group._id);

  // Get all expenses from those groups
  const expenses = await Expense.find({
    group: { $in: groupIds },
  });

  let totalPaid = 0;
  let totalOwes = 0;

  expenses.forEach((expense) => {
    // Money paid by logged-in user
    if (expense.paidBy.toString() === userId.toString()) {
      totalPaid += expense.amount;
    }

    // Money user owes
    expense.participants.forEach((participant) => {
      if (participant.user.toString() === userId.toString()) {
        totalOwes += participant.amount;
      }
    });
  });

  return {
    totalPaid,
    totalOwes,
    netBalance: totalPaid - totalOwes,
    totalGroups: groups.length,
    totalExpenses: expenses.length,
  };
};
