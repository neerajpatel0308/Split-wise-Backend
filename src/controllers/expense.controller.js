import { Expense } from "../models/Expense.js";
import * as settlementService from "../services/settlementService.js";

export const createExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, splitDetails, groupId } = req.body;

    const newExpense = await Expense.create({
      description,
      amount,
      paidBy,
      splitDetails,
      groupId,
    });

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.find({ groupId });

    const balances = settlementService.calculateNetBalances(expenses);
    res.status(200).json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
