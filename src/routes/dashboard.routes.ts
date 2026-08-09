import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";

const router = Router();

router.use(authenticate);
router.get("/user", authorizePermission("DASHBOARD_USER_VIEW"), dashboardController.userDashboard);
router.get("/organization", authorizePermission("DASHBOARD_ORGANIZATION_VIEW"), dashboardController.organizationDashboard);

export default router;
