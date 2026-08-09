import { userRepository } from "../repositories/user.repository";
import { organizationRepository } from "../repositories/organization.repository";
import { permissionRepository } from "../repositories/permission.repository";
import { menuService } from "./menu.service";
import { tokenRepository } from "../repositories/token.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { comparePassword, hashPassword, generateSecureToken, hashToken } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { UnauthorizedError, NotFoundError } from "../constants/errors";
import { notificationService } from "./notification.service";

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function addMinutes(mins: number): Date {
  return new Date(Date.now() + mins * 60 * 1000);
}

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError("Invalid email or password");

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const organization = user.org_id ? await organizationRepository.findById(user.org_id) : null;
    const permissions = await permissionRepository.getPermissionCodesForRole(user.role_name);
    const menus = await menuService.getMyMenus(user.role_name);

    const accessToken = signAccessToken({ userId: user.user_id, role: user.role_name, orgId: user.org_id });
    const refreshToken = signRefreshToken({ userId: user.user_id });
    await tokenRepository.storeRefreshToken(user.user_id, hashToken(refreshToken), addDays(7));

    await userRepository.updateLastLogin(user.user_id);

    return {
      user: this.toSafeUser(user),
      role: { roleId: user.role_id, roleName: user.role_name },
      organization,
      permissions,
      menus,
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    let payload: { userId: number };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    const stored = await tokenRepository.findValidRefreshToken(payload.userId, hashToken(refreshToken));
    if (!stored) throw new UnauthorizedError("Refresh token has been revoked");

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError();

    const accessToken = signAccessToken({ userId: user.user_id, role: user.role_name, orgId: user.org_id });
    return { accessToken };
  },

  async logout(refreshToken: string) {
    await tokenRepository.revokeRefreshToken(hashToken(refreshToken));
  },

  async me(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const organization = user.org_id ? await organizationRepository.findById(user.org_id) : null;
    const permissions = await permissionRepository.getPermissionCodesForRole(user.role_name);
    const menus = await menuService.getMyMenus(user.role_name);
    return { user: this.toSafeUser(user), role: { roleId: user.role_id, roleName: user.role_name }, organization, permissions, menus };
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");
    const hash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, hash);
    await tokenRepository.revokeAllForUser(userId);
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    // Always behave the same whether or not the user exists, to avoid
    // leaking which emails are registered.
    if (!user) return;

    const token = generateSecureToken();
    await tokenRepository.storeResetToken(user.user_id, hashToken(token), addMinutes(30));

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173" || "https://income-fronend.vercel.app"}/reset-password?token=${token}`;
    await notificationService.send({
      userId: user.user_id,
      templateCode: "PASSWORD_RESET_EMAIL",
      vars: { firstName: user.first_name, resetLink },
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const stored = await tokenRepository.findValidResetToken(hashToken(token));
    if (!stored) throw new UnauthorizedError("Reset link is invalid or has expired");
    const hash = await hashPassword(newPassword);
    await userRepository.updatePassword(stored.user_id, hash);
    await tokenRepository.markResetTokenUsed(stored.reset_id);
    await tokenRepository.revokeAllForUser(stored.user_id);
  },

  toSafeUser(user: any) {
    return {
      userId: user.user_id,
      userUuid: user.user_uuid,
      orgId: user.org_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      lastLoginAt: user.last_login_at,
    };
  },
};
