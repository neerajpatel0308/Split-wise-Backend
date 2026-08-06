import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
} from "../controllers/group.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protect, createGroup);
router.get("/", protect, getGroups);
router.get("/:grouId", protect, getGroupById);

router.post("/:groupId/members", protect, addMember);

export default router;
