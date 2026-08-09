import { emailConfig, isEmailConfigured } from "../config/email";

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Thin wrapper around the Brevo transactional email API.
 * If BREVO_API_KEY is not configured (e.g. local dev without a key),
 * this logs to the console instead of throwing, so the rest of the
 * app keeps working.
 */
export const emailService = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    if (!isEmailConfigured()) {
      console.warn(`[email.service] BREVO not configured. Skipping send to ${input.to}: "${input.subject}"`);
      return { success: false, error: "BREVO_NOT_CONFIGURED" };
    }

    try {
      const response = await fetch(emailConfig.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": emailConfig.apiKey,
        },
        body: JSON.stringify({
          sender: { email: emailConfig.senderEmail, name: emailConfig.senderName },
          to: [{ email: input.to, name: input.toName || input.to }],
          subject: input.subject,
          htmlContent: input.htmlContent,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        messageId?: string;
      };

      if (!response.ok) {
        return { success: false, error: data.message || `Brevo responded ${response.status}` };
      }

      return { success: true, providerMessageId: data.messageId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown email error" };
    }
  },

  renderTemplate(bodyTemplate: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
      (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
      bodyTemplate
    );
  },
};
