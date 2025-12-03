import { getAdminSock } from "./adminWhatsapp.js";

const cleanPhone = (number) => {
  if (!number) return null;

  let cleaned = number.toString().trim().replace(/[^0-9]/g, "");

  // If 10-digit Indian number → add +91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  return cleaned;
};

export const Notifications = {
  /* ==========================================
     SEND MESSAGE TO USER
  =========================================== */
  sendToUser: async (phone, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock) {
        console.log("❌ Admin WhatsApp not connected.");
        return;
      }

      const cleaned = cleanPhone(phone);
      if (!cleaned) {
        console.log("❌ Invalid user phone number.");
        return;
      }

      const jid = `${cleaned}@s.whatsapp.net`;

      await adminSock.sendMessage(jid, { text });
      console.log("📩 User Notification Sent:", cleaned);

    } catch (err) {
      console.error("❌ Error sending user notification:", err.message);
    }
  },

  /* ==========================================
     SEND MESSAGE TO ADMIN
  =========================================== */
  sendToAdmin: async (text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock) {
        console.log("❌ Admin WhatsApp not connected.");
        return;
      }

      const adminNumber = cleanPhone(process.env.ADMIN_PHONE);
      if (!adminNumber) {
        console.log("❌ ADMIN_PHONE missing in .env");
        return;
      }

      const jid = `${adminNumber}@s.whatsapp.net`;

      await adminSock.sendMessage(jid, { text });
      console.log("👑 Admin Notification Sent:", adminNumber);

    } catch (err) {
      console.error("❌ Error sending admin notification:", err.message);
    }
  }
};
