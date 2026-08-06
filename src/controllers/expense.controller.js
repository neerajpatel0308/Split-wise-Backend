import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
// import mongoose from "mongoose";

export const createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      groupId,
      paidBy,
      splitType,
      participants,
    } = req.body;

    // Validation
    if (
      !title ||
      !amount ||
      !groupId ||
      !paidBy ||
      !splitType ||
      !participants?.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    // Check if group exists
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Check if current user belongs to the group
    if (
      !group.members.some((member) => member.toString() === paidBy.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group.",
      });
    }
    console.log("Request Body:", req.body);
    console.log("Paid By:", paidBy);

    let finalParticipants = [];
    if (splitType === "equal") {
      const share = Number((amount / participants.length).toFixed(2));

      finalParticipants = participants.map((participant) => ({
        user: participant.user,
        amount: share,
        percentage: 0,
        paid: false,
      }));
    } else if (splitType === "percentage") {
      const totalPercentage = participants.reduce(
        (sum, participant) => sum + Number(participant.percentage),
        0,
      );

      if (totalPercentage !== 100) {
        return res.status(400).json({
          success: false,
          message: "Total percentage must equal 100.",
        });
      }

      finalParticipants = participants.map((participant) => ({
        user: participant.user,
        percentage: participant.percentage,
        amount: Number(((amount * participant.percentage) / 100).toFixed(2)),
        paid: false,
      }));
    } else if (splitType === "exact") {
      const totalAmount = participants.reduce(
        (sum, participant) => sum + Number(participant.amount),
        0,
      );

      if (totalAmount !== Number(amount)) {
        return res.status(400).json({
          success: false,
          message: "Participant amounts must equal total expense.",
        });
      }

      finalParticipants = participants.map((participant) => ({
        user: participant.user,
        amount: participant.amount,
        percentage: 0,
        paid: false,
      }));
    }

    const expense = await Expense.create({
      title,
      description,
      amount,
      paidBy,
      group: groupId,
      splitType,
      participants: finalParticipants,
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "fullName email")
      .populate("participants.user", "fullName email");

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "fullName email")
      .populate("participants.user", "fullName email")
      .populate("group", "name");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
