import express from "express";
import upload from "../middleware/upload.middleware.js";
import { updateAvatar } from "../controllers/user.controller.js";
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
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

export default router;
