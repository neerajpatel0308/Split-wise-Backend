import mongoose from "mongoose";

const splitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    paid: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },

    splitType: {
      type: String,
      enum: ["equal", "percentage", "exact"],
      required: true,
    },

    participants: [splitSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Expense", expenseSchema);
