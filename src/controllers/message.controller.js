import Message from "../models/Message.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID.",
      });
    }

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Check whether logged-in user belongs to group
    const isMember = group.members.some(
      (member) => member.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group.",
      });
    }

    // Get messages
    const messages = await Message.find({
      group: groupId,
    })
      .populate("sender", "fullName email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("GET GROUP MESSAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
