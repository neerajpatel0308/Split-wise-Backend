import mongoose from "mongoose";
import Group from "../models/Group.js";
import User from "../models/User.js";

export const createGroup = async (req, res) => {
  try {
   
    const { name, description, members = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const allMembers = [...new Set([req.user._id.toString(), ...members])];

    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: allMembers,
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGroups = async (req, res) => {
  console.log("🔥 GET GROUPS CONTROLLER HIT");

  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate("createdBy", "fullName email")
      .populate("members", "fullName email");

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("GET GROUPS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User already exists in the group",
      });
    }

    group.members.push(userId);

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("createdBy", "fullName email avatar")
      .populate("members", "fullName email avatar");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("createdBy", "fullName email avatar")
      .populate("members", "fullName email avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGroupDashboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
