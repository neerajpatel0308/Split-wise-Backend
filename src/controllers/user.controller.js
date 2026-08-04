import User from "../models/User.js";

export const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const users = await User.find({
      email: { $regex: email, $options: "i" },
    }).select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Fullname Is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile Update Succesfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
