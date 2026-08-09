/**
 * FUTURE: WhatsApp channel.
 *
 * This file intentionally does nothing yet. When a WhatsApp provider
 * is chosen, implement sendMessage() here and add a "WHATSAPP" case
 * to notification.service.ts's switch. No other file needs to change:
 * users/incomes/expenses/roles/permissions/menus tables are untouched,
 * and notification_contacts + notification_preferences already support
 * the WHATSAPP channel value today.
 */
export const whatsappService = {
  async sendMessage(_to: string, _message: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "WhatsApp channel not yet implemented" };
  },
};
