import { getDashboardSummary } from "../services/dashboard.service.js";

export const dashboardSummary = async (req, res) => {
  try {
    const summary = await getDashboardSummary(req.user._id);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
