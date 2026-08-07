import express from "express";
import {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
} from "../controllers/expense.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createExpense);
router.get("/group/:groupId", protect, getExpensesByGroup);
router.get("/:expenseId", protect, getExpenseById);
router.put("/:expenseId", protect, getExpenseById);
export default router;
