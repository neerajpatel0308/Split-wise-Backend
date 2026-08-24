import generateToken from "../utils/generateToken.js";
import { protect } from "../middleware/auth.middleware.js";
import { checkAuth } from "../controllers/auth.controller.js";

import express from "express";
import {
  register,
  verifyEmail,
  verifyOTP,
  resendOTP,
  login,
  logout,
  verifyToken,
  googleLogin,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyOTP);
router.post("/verify-otp", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/verify-token", protect, verifyToken);
router.post("/google", googleLogin);
router.get("/check", protect, checkAuth);

export default router;
