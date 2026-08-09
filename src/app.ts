import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { generalRateLimit } from "./middleware/rate-limit.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import organizationRoutes from "./routes/organization.routes";
import userRoutes from "./routes/user.routes";
import incomeRoutes from "./routes/income.routes";
import expenseRoutes from "./routes/expense.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";
import menuRoutes from "./routes/menu.routes";
import notificationRoutes from "./routes/notification.routes";
import webhookRoutes from "./routes/webhook.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(generalRateLimit);

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
