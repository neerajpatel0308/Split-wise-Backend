import { sendOTPEmail } from "../utils/sendEmail.js";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { OAuth2Client } from "google-auth-library";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import { cookieOptions } from "../config/cookie.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    console.log("Registering user:", { fullName, email });

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // -------------------------
    // CHECK EXISTING USER
    // -------------------------

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // -------------------------
    // GENERATE OTP
    // -------------------------

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    // -------------------------
    // DELETE OLD OTP
    // -------------------------

    await OTP.deleteMany({ email });

    // -------------------------
    // STORE TEMPORARY REGISTRATION
    // -------------------------

    await OTP.create({
      fullName,
      email,
      password,
      otp,
      expiresAt: otpExpiry,
      otpResendAvailableAt: resendAvailableAt,
    });

    // -------------------------
    // SEND OTP
    // -------------------------

    await sendOTPEmail(email, otp);

    // -------------------------
    // RESPONSE
    // -------------------------

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // -------------------------
    // FIND OTP
    // -------------------------

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

    // -------------------------
    // CHECK EXPIRY
    // -------------------------

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // -------------------------
    // CHECK USER AGAIN
    // -------------------------

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

    // -------------------------
    // CREATE USER
    // -------------------------

    const user = await User.create({
      fullName: otpRecord.fullName,
      email: otpRecord.email,
      password: otpRecord.password,
      isVerified: true,
    });

    // -------------------------
    // DELETE OTP
    // -------------------------

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // -------------------------
    // RESPONSE
    // -------------------------

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
    console.error("VERIFY OTP ERROR:", error);

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

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "PLease Register",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    // Check password
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

    // Validate
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Find OTP
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

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Mark OTP verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Mark user verified
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // -------------------------
    // FIND TEMPORARY OTP RECORD
    // -------------------------

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "Registration not found. Please register again.",
      });
    }

    // -------------------------
    // RATE LIMIT
    // -------------------------

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

    // -------------------------
    // GENERATE NEW OTP
    // -------------------------

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    // -------------------------
    // UPDATE OTP RECORD
    // -------------------------

    otpRecord.otp = otp;
    otpRecord.expiresAt = otpExpiry;
    otpRecord.otpResendAvailableAt = resendAvailableAt;
    otpRecord.verified = false;

    await otpRecord.save();

    // -------------------------
    // SEND NEW OTP
    // -------------------------

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully. Please check your email.",
      resendAvailableAt,
    });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
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
    // console.log("Google login credential:", idToken);

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
    console.log("Here is the token : ", token);

    return res.status(200).json({
      success: true,
      message: "Google Login Successful",
      user,
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

// export const getCurrentUser = async (req, res) => {
//   try {
//     return res.status(200).json({
//       success: true,
//       user: req.user,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
