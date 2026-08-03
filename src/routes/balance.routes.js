import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getBalances } from "../controllers/balance.controller.js";

const router = express.Router();

router.get("/:groupId", protect, getBalances);

export default router;
