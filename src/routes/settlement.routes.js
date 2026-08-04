import express from "express";
import { createSettlement } from "../controllers/settlement.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createSettlement);

export default router;
