import { notificationRepository } from "../repositories/notification.repository";
import { userRepository } from "../repositories/user.repository";
import { emailService } from "./email.service";

export interface SendNotificationInput {
  userId: number;
  templateCode: string;
  vars: Record<string, string>;
  channels?: Array<"EMAIL" | "WHATSAPP" | "SMS">;
}

/**
 * Central fan-out point for all outbound notifications.
 *
 * Flow: identify user/org -> check preferences -> find contact ->
 * find template -> create log -> send via channel service -> update log.
 *
 * Adding WhatsApp/SMS later only means adding a case in the switch
 * below and a whatsapp.service.ts / sms.service.ts -- this function's
 * signature and the callers (income/expense/auth services) never change.
 */
export const notificationService = {
  async send(input: SendNotificationInput) {
    const channels = input.channels ?? ["EMAIL"];
    const user = await userRepository.findById(input.userId);
    if (!user) return;

    const prefs = await notificationRepository.getPreferences(input.userId);

    for (const channel of channels) {
      if (channel === "EMAIL" && prefs && prefs.email_enabled === false) continue;

      const recipient = channel === "EMAIL" ? user.email : null;
      if (!recipient) continue;

      const template = await notificationRepository.getTemplate(input.templateCode, channel);
      if (!template) continue;

      const subject = template.subject
        ? emailService.renderTemplate(template.subject, input.vars)
        : undefined;
      const message = emailService.renderTemplate(template.body_template, input.vars);

      const log = await notificationRepository.createLog({
        orgId: user.org_id,
        userId: user.user_id,
        channel,
        recipient,
        templateCode: input.templateCode,
        subject,
        message,
      });

      if (channel === "EMAIL") {
        const result = await emailService.sendEmail({
          to: recipient,
          toName: `${user.first_name} ${user.last_name || ""}`.trim(),
          subject: subject || template.template_name,
          htmlContent: message,
        });
        if (result.success) {
          await notificationRepository.markSent(log.notification_log_id, result.providerMessageId);
        } else {
          await notificationRepository.markFailed(log.notification_log_id, result.error || "Unknown error");
        }
      }
      // WHATSAPP / SMS: future -- see whatsapp.service.ts placeholder below.
    }
  },
};
