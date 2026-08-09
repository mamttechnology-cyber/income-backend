import { Router } from "express";
import { permissionController } from "../controllers/permission.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("PERMISSION_VIEW"), permissionController.list);

export default router;
