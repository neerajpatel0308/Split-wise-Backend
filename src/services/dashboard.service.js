import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

export const getDashboardSummary = async (userId) => {
  const groups = await Group.find({
    members: userId,
  });

  const groupIds = groups.map((group) => group._id);
  const expenses = await Expense.find({
    group: { $in: groupIds },
  });

  let totalPaid = 0;
  let totalOwes = 0;

  expenses.forEach((expense) => {
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
