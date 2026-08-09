import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";

const router = Router();

router.use(authenticate);
router.get("/my-menus", menuController.myMenus);
router.get("/", authorizePermission("MENU_VIEW"), menuController.listAll);

export default router;
