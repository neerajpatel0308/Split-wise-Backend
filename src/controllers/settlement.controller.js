import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";

export const createSettlement = async (req, res) => {
  try {
    const { groupId, receiver, amount, note } = req.body;

    // Logged in user
    const payer = req.user._id;

    // Validation
    if (!groupId || !receiver || !amount) {
      return res.status(400).json({
        success: false,
        message: "Group, receiver and amount are required.",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0.",
      });
    }

    // Check group exists
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Check payer belongs to group
    if (
      !group.members.some((member) => member.toString() === payer.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group.",
      });
    }

    // Check receiver belongs to group
    if (!group.members.some((member) => member.toString() === receiver)) {
      return res.status(403).json({
        success: false,
        message: "Receiver is not a member of this group.",
      });
    }

    // Prevent self settlement
    if (payer.toString() === receiver) {
      return res.status(400).json({
        success: false,
        message: "You cannot settle with yourself.",
      });
    }

    const settlement = await Settlement.create({
      group: groupId,
      payer,
      receiver,
      amount,
      note,
    });

    res.status(201).json({
      success: true,
      message: "Settlement created successfully.",
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
