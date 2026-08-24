import { sendOTPEmail } from "../utils/sendEmail.js";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { OAuth2Client } from "google-auth-library";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import { cookieOptions } from "../config/cookie.js";

export const register = async (req, res) => {
  try {
    console.log("1. Register started");

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    console.log("2. Checking MongoDB...");

    const userExists = await User.findOne({ email });

    console.log("3. MongoDB query finished");

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    console.log("4. Generating OTP");

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    console.log("5. Saving OTP...");

    await OTP.deleteMany({ email });

    await OTP.create({
      fullName,
      email,
      password,
      otp,
      expiresAt: otpExpiry,
      otpResendAvailableAt: resendAvailableAt,
    });

    console.log("6. OTP saved");

    console.log("7. Sending email...");

    await sendOTPEmail(email, otp);

    console.log("8. Email sent");

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email,
      password: otpRecord.password,
      isVerified: true,
    });

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(201).json({
      success: true,
      message: "Email verified and account created successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Logging in user:", { email, password });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "PLease Register",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "Registration not found. Please register again.",
      });
    }

    if (
      otpRecord.otpResendAvailableAt &&
      otpRecord.otpResendAvailableAt > new Date()
    ) {
      const remainingSeconds = Math.ceil(
        (otpRecord.otpResendAvailableAt.getTime() - Date.now()) / 1000,
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        remainingSeconds,
      });
    }

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    otpRecord.otp = otp;
    otpRecord.expiresAt = otpExpiry;
    otpRecord.otpResendAvailableAt = resendAvailableAt;
    otpRecord.verified = false;

    await otpRecord.save();

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully. Please check your email.",
      resendAvailableAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logout Successful",
  });
};

export const verifyToken = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user,
  });
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let user = await User.findOne({
      email: payload.email,
    });

    if (!user) {
      user = await User.create({
        fullName: payload.name,
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
        isVerified: true,
        password: crypto.randomUUID(),
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Google Login Successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
