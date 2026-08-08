import generateToken from "../utils/generateToken.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkAuth } from "../controllers/auth.controller.js";

import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  resendOTP,
  verifyToken,
  googleLogin,
  // getCurrentUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/verify-token", protect, verifyToken);
router.post("/google", googleLogin);
router.get("/check", protect, checkAuth);
// router.get("/me", protect, getCurrentUser);

export default router;
