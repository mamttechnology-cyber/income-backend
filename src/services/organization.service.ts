import { withTransaction } from "../config/database";
import { organizationRepository } from "../repositories/organization.repository";
import { roleRepository } from "../repositories/role.repository";
import { hashPassword, generateTempPassword } from "../utils/password";
import { ConflictError, NotFoundError } from "../constants/errors";
import { PaginationParams } from "../utils/pagination";
import { notificationService } from "./notification.service";

export const organizationService = {
  async listOrganizations(pagination: PaginationParams) {
    return organizationRepository.list(pagination);
  },

  async getOrganization(orgId: number) {
    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError("Organization not found");
    return org;
  },

  async updateOrganization(orgId: number, data: Partial<{ name: string; email: string; mobile: string; address: string; status: string }>) {
    await this.getOrganization(orgId);
    return organizationRepository.update(orgId, data);
  },

  /**
   * Creates an organization AND its first ADMIN user in a single
   * database transaction (see requirement #78: transaction management).
   * If admin creation fails, the organization insert is rolled back too.
   */
  async createOrganizationWithAdmin(input: {
    orgCode: string;
    name: string;
    email?: string;
    mobile?: string;
    address?: string;
    adminFirstName: string;
    adminLastName?: string;
    adminEmail: string;
  }) {
    return withTransaction(async (client) => {
      const orgResult = await client.query(
        `INSERT INTO organizations (org_code, name, email, mobile, address) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [input.orgCode, input.name, input.email ?? null, input.mobile ?? null, input.address ?? null]
      );
      const org = orgResult.rows[0];

      const existingAdmin = await client.query(`SELECT 1 FROM users WHERE email = $1`, [input.adminEmail]);
      if ((existingAdmin.rowCount ?? 0) > 0) {
        throw new ConflictError("A user with this admin email already exists");
      }

      const adminRole = await roleRepository.findByName("ADMIN");
      if (!adminRole) throw new NotFoundError("ADMIN role not seeded");

      const tempPassword = generateTempPassword();
      const passwordHash = await hashPassword(tempPassword);

      const adminResult = await client.query(
        `INSERT INTO users (org_id, role_id, first_name, last_name, email, password_hash)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [org.org_id, adminRole.role_id, input.adminFirstName, input.adminLastName ?? null, input.adminEmail, passwordHash]
      );
      const admin = adminResult.rows[0];

      await client.query(
        `INSERT INTO notification_preferences (user_id, org_id) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [admin.user_id, org.org_id]
      );

      // Fire the welcome email after the transaction commits by returning
      // what's needed and letting the caller trigger it -- keeps the DB
      // transaction from waiting on an external HTTP call.
      return { organization: org, admin, tempPassword };
    }).then(async (result) => {
      await notificationService.send({
        userId: result.admin.user_id,
        templateCode: "WELCOME_EMAIL",
        vars: { firstName: result.admin.first_name, orgName: result.organization.name, tempPassword: result.tempPassword },
      });
      return result;
    });
  },

  async setStatus(orgId: number, status: "ACTIVE" | "INACTIVE") {
    await this.getOrganization(orgId);
    return organizationRepository.update(orgId, { status });
  },

  async deleteOrganization(orgId: number) {
    await this.getOrganization(orgId);
    await organizationRepository.remove(orgId);
  },
};
