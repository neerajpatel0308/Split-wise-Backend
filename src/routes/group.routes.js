import express from "express";
import {
  createGroup,
  getGroups,
  addMember,
} from "../controllers/group.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/", protect, createGroup);
router.get("/", protect, getGroups);

router.post("/:groupId/add-member", protect, addMember);

export default router;
