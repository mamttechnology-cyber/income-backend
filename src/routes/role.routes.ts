import { Router } from "express";
import { roleController } from "../controllers/role.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createRoleSchema, updateRoleSchema, setRolePermissionsSchema } from "../validators/role.validators";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("ROLE_VIEW"), roleController.list);
router.post("/", authorizePermission("ROLE_CREATE"), validateBody(createRoleSchema), roleController.create);
router.put("/:id", authorizePermission("ROLE_UPDATE"), validateBody(updateRoleSchema), roleController.update);
router.delete("/:id", authorizePermission("ROLE_DELETE"), roleController.remove);
router.get("/:roleId/permissions", authorizePermission("PERMISSION_VIEW"), roleController.getPermissions);
router.put("/:roleId/permissions", authorizePermission("PERMISSION_UPDATE"), validateBody(setRolePermissionsSchema), roleController.setPermissions);

export default router;
