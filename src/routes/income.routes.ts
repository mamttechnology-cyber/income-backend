import { Router } from "express";
import { incomeController } from "../controllers/income.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createIncomeSchema, updateIncomeSchema } from "../validators/income.validators";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("INCOME_VIEW"), incomeController.list);
router.get("/:id", authorizePermission("INCOME_VIEW"), incomeController.getById);
router.post("/", authorizePermission("INCOME_CREATE"), validateBody(createIncomeSchema), incomeController.create);
router.put("/:id", authorizePermission("INCOME_UPDATE"), validateBody(updateIncomeSchema), incomeController.update);
router.delete("/:id", authorizePermission("INCOME_DELETE"), incomeController.remove);

export default router;
