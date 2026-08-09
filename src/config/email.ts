import { env } from "./env";

export const emailConfig = {
  apiKey: env.brevoApiKey,
  senderEmail: env.brevoSenderEmail,
  senderName: env.brevoSenderName,
  apiUrl: "https://api.brevo.com/v3/smtp/email",
};

export function isEmailConfigured(): boolean {
  return Boolean(emailConfig.apiKey && emailConfig.senderEmail);
}
