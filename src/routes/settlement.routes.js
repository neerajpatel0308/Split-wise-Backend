import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createSettlement } from "../controllers/settlement.controller.js";

const router = express.Router();

router.post("/", protect, createSettlement);

export default router;
