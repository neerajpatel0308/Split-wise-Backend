import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";
import { calculatePairwiseDebt } from "../utils/balance.utils.js";

export const createSettlement = async (req, res) => {
  try {
    const { groupId, receiver, amount, note } = req.body;

    const payer = req.user._id;
    if (!groupId || !receiver || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Group, receiver and amount are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID.",
      });
    }

    const amountToSettle = Number(amount);

    if (!Number.isFinite(amountToSettle) || amountToSettle <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number greater than 0.",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const isPayerMember = group.members.some(
      (member) => member.toString() === payer.toString(),
    );

    if (!isPayerMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group.",
      });
    }

    const isReceiverMember = group.members.some(
      (member) => member.toString() === receiver.toString(),
    );

    if (!isReceiverMember) {
      return res.status(403).json({
        success: false,
        message: "Receiver is not a member of this group.",
      });
    }

    if (payer.toString() === receiver.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot settle with yourself.",
      });
    }

    // Calculate actual outstanding debt
    const amountOwed = await calculatePairwiseDebt(groupId, payer, receiver);

    if (amountOwed <= 0) {
      return res.status(400).json({
        success: false,
        message: "No outstanding balance exists between these users.",
        outstandingAmount: 0,
      });
    }

    if (amountToSettle > amountOwed) {
      return res.status(400).json({
        success: false,
        message: `Settlement amount cannot be greater than the outstanding amount of ₹${amountOwed}.`,
        outstandingAmount: amountOwed,
      });
    }

    const settlement = await Settlement.create({
      group: groupId,
      payer,
      receiver,
      amount: amountToSettle,
      note: note || "",
      status: "completed",
      settledAt: new Date(),
    });
    return res.status(201).json({
      success: true,
      message: "Settlement created successfully.",
      settlement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.settlementId);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    settlement.status = "completed";
    settlement.settledAt = new Date();

    await settlement.save();

    res.status(200).json({
      success: true,
      message: "Settlement completed",
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.settlementId)
      .populate("payer", "fullName email")
      .populate("receiver", "fullName email");

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    res.status(200).json({
      success: true,
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
