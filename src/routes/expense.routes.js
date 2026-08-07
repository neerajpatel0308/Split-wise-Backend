import express from "express";
import {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  updateExpense,
} from "../controllers/expense.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createExpense);
router.put("/:expenseId", protect, updateExpense);
router.get("/group/:groupId", protect, getExpensesByGroup);
router.get("/:expenseId", protect, getExpenseById);
export default router;
