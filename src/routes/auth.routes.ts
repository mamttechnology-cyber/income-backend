import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { authRateLimit } from "../middleware/rate-limit.middleware";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, refreshSchema } from "../validators/auth.validators";

const router = Router();

router.post("/login", authRateLimit, validateBody(loginSchema), authController.login);
router.post("/refresh", validateBody(refreshSchema), authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.post("/forgot-password", authRateLimit, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authRateLimit, validateBody(resetPasswordSchema), authController.resetPassword);
router.post("/change-password", authenticate, validateBody(changePasswordSchema), authController.changePassword);
router.get("/me", authenticate, authController.me);

export default router;
