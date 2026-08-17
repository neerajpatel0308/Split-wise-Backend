import express from "express";
import { getGroupMessages } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:groupId", protect, getGroupMessages);

export default router;
