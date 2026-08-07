import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createSettlement,
  updateSettlement,
  getSettlement,
} from "../controllers/settlement.controller.js";

const router = express.Router();

router.post("/", protect, createSettlement);
router.put("/:settlementId", protect, updateSettlement);
router.get("/:settlementId", protect, getSettlement);

export default router;
