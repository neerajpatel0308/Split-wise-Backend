import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getProfile,
  searchUsers,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.get("/search", protect, searchUsers);
router.patch("/profile", protect, updateProfile);

export default router;
