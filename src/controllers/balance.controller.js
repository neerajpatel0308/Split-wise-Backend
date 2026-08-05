import { calculateBalances } from "../services/balance.service.js";

export const getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const balances = await calculateBalances(groupId);

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
