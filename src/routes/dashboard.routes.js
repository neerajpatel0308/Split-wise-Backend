import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { dashboardSummary } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/summary", protect, dashboardSummary);

export default router;
