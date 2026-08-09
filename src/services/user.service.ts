import { userRepository } from "../repositories/user.repository";
import { roleRepository } from "../repositories/role.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { hashPassword, generateTempPassword } from "../utils/password";
import { ConflictError, NotFoundError, ForbiddenError } from "../constants/errors";
import { PaginationParams } from "../utils/pagination";
import { notificationService } from "./notification.service";

export const userService = {
  async createUser(input: {
    actingOrgId: number | null;
    orgId: number | null;
    roleName: string;
    firstName: string;
    lastName?: string;
    email: string;
    mobile?: string;
  }) {
    // ADMIN can only create users inside their own organization.
    if (input.actingOrgId !== null && input.actingOrgId !== input.orgId) {
      throw new ForbiddenError("Cannot create a user outside your organization");
    }
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("A user with this email already exists");

    const role = await roleRepository.findByName(input.roleName);
    if (!role) throw new NotFoundError("Role not found");

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await userRepository.create({
      orgId: input.orgId,
      roleId: role.role_id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      mobile: input.mobile,
      passwordHash,
    });

    await notificationRepository.ensurePreferences(user.user_id, user.org_id);

    await notificationService.send({
      userId: user.user_id,
      templateCode: "WELCOME_EMAIL",
      vars: { firstName: user.first_name, orgName: "your organization", tempPassword },
    });

    return user;
  },

  async listUsers(orgId: number | null, pagination: PaginationParams) {
    return userRepository.listByOrg(orgId, pagination);
  },

  async getUser(userId: number, orgId: number | null) {
    const user = orgId === null
      ? await userRepository.findById(userId)
      : await userRepository.findByIdAndOrg(userId, orgId);
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  async updateUser(userId: number, orgId: number | null, data: Partial<{ firstName: string; lastName: string; mobile: string; status: string; roleName: string }>) {
    await this.getUser(userId, orgId);
    let roleId: number | undefined;
    if (data.roleName) {
      const role = await roleRepository.findByName(data.roleName);
      if (!role) throw new NotFoundError("Role not found");
      roleId = role.role_id;
    }
    return userRepository.update(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile,
      status: data.status,
      roleId,
    });
  },

  async deleteUser(userId: number, orgId: number | null) {
    const user = await this.getUser(userId, orgId);
    if (user.role_name === "ADMIN" || user.role_name === "SUPER_ADMIN") {
      throw new ForbiddenError("Admins cannot be deleted. Please contact the system administrator.");
    }
    await userRepository.remove(userId);
  },
};
