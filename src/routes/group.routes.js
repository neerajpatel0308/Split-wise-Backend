import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  getGroupDashboard,
} from "../controllers/group.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protect, createGroup);
router.get("/", protect, getGroups);
router.get("/:grouId", protect, getGroupById);

router.post("/:groupId/members", protect, addMember);
router.get("/:groupId/dashboard", protect, getGroupDashboard);

export default router;
