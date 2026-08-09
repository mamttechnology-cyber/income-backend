import { pool } from "../config/database";

export const notificationRepository = {
  async getPreferences(userId: number) {
    const { rows } = await pool.query(`SELECT * FROM notification_preferences WHERE user_id = $1`, [userId]);
    return rows[0] ?? null;
  },

  async ensurePreferences(userId: number, orgId: number | null) {
    await pool.query(
      `INSERT INTO notification_preferences (user_id, org_id) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, orgId]
    );
  },

  async updatePreferences(userId: number, data: Partial<{
    emailEnabled: boolean; whatsappEnabled: boolean; smsEnabled: boolean;
    incomeNotification: boolean; expenseNotification: boolean;
    passwordNotification: boolean; accountNotification: boolean;
  }>) {
    const map: Record<string, string> = {
      emailEnabled: "email_enabled", whatsappEnabled: "whatsapp_enabled", smsEnabled: "sms_enabled",
      incomeNotification: "income_notification", expenseNotification: "expense_notification",
      passwordNotification: "password_notification", accountNotification: "account_notification",
    };
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${map[key]} = $${params.length}`);
    });
    if (fields.length === 0) return this.getPreferences(userId);
    params.push(userId);
    const { rows } = await pool.query(
      `UPDATE notification_preferences SET ${fields.join(", ")}, updated_at = now() WHERE user_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },

  async getPrimaryContact(userId: number, channel: string) {
    const { rows } = await pool.query(
      `SELECT * FROM notification_contacts WHERE user_id = $1 AND channel = $2 AND is_enabled = TRUE
       ORDER BY is_primary DESC LIMIT 1`,
      [userId, channel]
    );
    return rows[0] ?? null;
  },

  async getTemplate(templateCode: string, channel: string) {
    const { rows } = await pool.query(
      `SELECT * FROM notification_templates WHERE template_code = $1 AND channel = $2 AND status = 'ACTIVE'`,
      [templateCode, channel]
    );
    return rows[0] ?? null;
  },

  async createLog(data: {
    orgId: number | null; userId: number | null; channel: string; recipient: string;
    templateCode: string; subject?: string; message?: string;
  }) {
    const { rows } = await pool.query(
      `INSERT INTO notification_logs (org_id, user_id, channel, recipient, template_code, subject, message, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING') RETURNING *`,
      [data.orgId, data.userId, data.channel, data.recipient, data.templateCode, data.subject ?? null, data.message ?? null]
    );
    return rows[0];
  },

  async markSent(logId: number, providerMessageId?: string) {
    await pool.query(
      `UPDATE notification_logs SET status = 'SENT', provider_message_id = $2, sent_at = now(), updated_at = now() WHERE notification_log_id = $1`,
      [logId, providerMessageId ?? null]
    );
  },

  async markFailed(logId: number, errorMessage: string) {
    await pool.query(
      `UPDATE notification_logs SET status = 'FAILED', error_message = $2, retry_count = retry_count + 1, last_retry_at = now(), updated_at = now() WHERE notification_log_id = $1`,
      [logId, errorMessage]
    );
  },

  async listByOrg(orgId: number | null, limit: number, offset: number) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM notification_logs ${whereClause}`, params);
    const { rows } = await pool.query(
      `SELECT * FROM notification_logs ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { rows, total: countResult.rows[0].count as number };
  },

  async listTemplates() {
    const { rows } = await pool.query(`SELECT * FROM notification_templates ORDER BY template_id`);
    return rows;
  },

  async getTemplateById(templateId: number) {
    const { rows } = await pool.query(`SELECT * FROM notification_templates WHERE template_id = $1`, [templateId]);
    return rows[0] ?? null;
  },

  async updateTemplate(templateId: number, data: Partial<{ templateName: string; subject: string; bodyTemplate: string; status: string }>) {
    const map: Record<string, string> = {
      templateName: "template_name",
      subject: "subject",
      bodyTemplate: "body_template",
      status: "status",
    };
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${map[key]} = $${params.length}`);
    });
    if (fields.length === 0) return this.getTemplateById(templateId);
    params.push(templateId);
    const { rows } = await pool.query(
      `UPDATE notification_templates SET ${fields.join(", ")}, updated_at = now() WHERE template_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },
};
