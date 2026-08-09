import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { updatePreferencesSchema, updateTemplateSchema } from "../validators/notification.validators";

const router = Router();

router.use(authenticate);
router.get("/logs", authorizePermission("NOTIFICATION_LOG_VIEW"), notificationController.listLogs);
router.get("/templates", authorizePermission("NOTIFICATION_TEMPLATE_VIEW"), notificationController.listTemplates);
router.put("/templates/:id", authorizePermission("NOTIFICATION_TEMPLATE_UPDATE"), validateBody(updateTemplateSchema), notificationController.updateTemplate);
router.get("/preferences", authorizePermission("NOTIFICATION_PREFERENCE_VIEW"), notificationController.getPreferences);
router.put("/preferences", authorizePermission("NOTIFICATION_PREFERENCE_UPDATE"), validateBody(updatePreferencesSchema), notificationController.updatePreferences);

export default router;
