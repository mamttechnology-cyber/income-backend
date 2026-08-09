import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermission } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validators";

const router = Router();

router.use(authenticate);
router.get("/", authorizePermission("EXPENSE_VIEW"), expenseController.list);
router.get("/:id", authorizePermission("EXPENSE_VIEW"), expenseController.getById);
router.post("/", authorizePermission("EXPENSE_CREATE"), validateBody(createExpenseSchema), expenseController.create);
router.put("/:id", authorizePermission("EXPENSE_UPDATE"), validateBody(updateExpenseSchema), expenseController.update);
router.delete("/:id", authorizePermission("EXPENSE_DELETE"), expenseController.remove);

export default router;
