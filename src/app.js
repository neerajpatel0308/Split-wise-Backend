import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import balanceRoutes from "./routes/balance.routes.js";
import settlementRoutes from "./routes/settlement.routes.js";
import path from "path";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { fileURLToPath } from "url";
// import transporter from "./config/mail.js";

import morgan from "morgan";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/balances", balanceRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/dashboard", dashboardRoutes);

export default app;
