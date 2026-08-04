import express from "express";
import upload from "../middleware/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  getProfile,
  searchUsers,
  updateProfile,
  updateAvatar,
  getAllUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.get("/search", protect, searchUsers);
router.patch("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/", protect, getAllUsers);

export default router;
