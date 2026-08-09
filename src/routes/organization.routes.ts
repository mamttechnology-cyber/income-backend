import { Router } from "express";
import { organizationController } from "../controllers/organization.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createOrganizationSchema, updateOrganizationSchema, statusSchema } from "../validators/organization.validators";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("ORGANIZATION_VIEW"), organizationController.list);
router.get("/:id", authorizePermission("ORGANIZATION_VIEW"), organizationController.getById);
router.post("/", authorizePermission("ORGANIZATION_CREATE"), validateBody(createOrganizationSchema), organizationController.create);
router.put("/:id", authorizePermission("ORGANIZATION_UPDATE"), validateBody(updateOrganizationSchema), organizationController.update);
router.patch("/:id/status", authorizePermission("ORGANIZATION_UPDATE"), validateBody(statusSchema), organizationController.setStatus);
router.delete("/:id", authorizePermission("ORGANIZATION_DELETE"), organizationController.remove);

export default router;
