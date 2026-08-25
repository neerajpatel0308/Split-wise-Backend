import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    console.log("Raw Cookie header:", req.headers.cookie);
console.log("Parsed Cookies:", req.cookies);
console.log("Token exists:", !!req.cookies?.token);
    let token;
    if (!req.cookies?.token) {
  console.log("❌ 401 branch: no token in cookies");
  return res.status(401).json({ ... });
}

    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

  try {
  decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
  console.log("✅ JWT decoded:", decoded);
} catch (e) {
  console.log("❌ 401 branch: jwt.verify threw:", e.name, e.message);
  return res.status(401).json({message: "test4"});
}

    const user = await User.findById(decoded.id).select("-password");
if (!user) {
  console.log("❌ 401 branch: User.findById returned null for id:", decoded.id);
  return res.status(401).json({ ... });
}

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ Found user:", user._id, user.email);
console.log("✅ ABOUT TO CALL NEXT()");

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};