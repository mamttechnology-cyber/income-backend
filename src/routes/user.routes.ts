import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createUserSchema, updateUserSchema } from "../validators/user.validators";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("USER_VIEW"), userController.list);
router.get("/:id", authorizePermission("USER_VIEW"), userController.getById);
router.post("/", authorizePermission("USER_CREATE"), validateBody(createUserSchema), userController.create);
router.put("/:id", authorizePermission("USER_UPDATE"), validateBody(updateUserSchema), userController.update);
router.delete("/:id", authorizePermission("USER_DELETE"), userController.remove);

export default router;
