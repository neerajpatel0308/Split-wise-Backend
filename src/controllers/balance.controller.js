import { calculateFinalBalances } from "../utils/balance.utils.js";

export const getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const balances = await calculateFinalBalances(groupId);
    res.status(200).json({
      success: true,
      balances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
