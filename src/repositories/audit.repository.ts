import { pool } from "../config/database";

export const auditRepository = {
  async log(entry: {
    userId?: number | null; orgId?: number | null; action: string; module?: string;
    recordId?: number | null; description?: string; ipAddress?: string; userAgent?: string;
  }) {
    await pool.query(
      `INSERT INTO audit_logs (user_id, org_id, action, module, record_id, description, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.userId ?? null, entry.orgId ?? null, entry.action, entry.module ?? null,
        entry.recordId ?? null, entry.description ?? null, entry.ipAddress ?? null, entry.userAgent ?? null,
      ]
    );
  },
};
