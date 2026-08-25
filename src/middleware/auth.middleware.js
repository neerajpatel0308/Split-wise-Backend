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
      return res.status(401).json({ message: "test-6" });
    }

    token = req.cookies.token;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ JWT decoded:", decoded);

      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        console.log("❌ 401 branch: User.findById returned null for id:", decoded.id);
        return res.status(401).json({ success: false, message: "User not found" });
      }

      req.user = user;
      console.log("✅ Found user:", req.user._id, req.user.email);
      console.log("✅ ABOUT TO CALL NEXT()");

      next();
      
    } catch (e) {
      console.log("❌ 401 branch: jwt.verify threw:", e.name, e.message);
      return res.status(401).json({ message: "test4" });
    }

  } catch (error) {
    console.log("❌ Outer catch error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};