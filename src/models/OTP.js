import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Temporary registration data
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // OTP
    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // Resend rate limit
    otpResendAvailableAt: {
      type: Date,
      default: null,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically delete expired OTP documents
otpSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

export default mongoose.model("OTP", otpSchema);
