import { getAdminSock } from "./adminWhatsapp.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import User from "../models/User.js";


import { cleanPhone,toJID } from "../utils/phoneUtils.js";

export const Notifications = {

  sendToUser: async (userId, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

    
      const session = await WhatsAppSession.findOne({ userId });

      let phoneToUse = null;

      if (session && session.connected && session.phoneNumber) {
       
        phoneToUse = session.phoneNumber;
        console.log(`✅ Using connected WhatsApp number: ${phoneToUse}`);
      } else {
       
        const user = await User.findById(userId);
        if (user && user.phone) {
          phoneToUse = user.phone;
          console.log(`⚠️ WhatsApp not connected, using signup phone: ${phoneToUse}`);
        } else {
          console.log("❌ No phone number found for user:", userId);
          return { success: false, error: "No phone number available" };
        }
      }

      
      const jid = toJID(phoneToUse);
      if (!jid) {
        console.log("❌ Invalid phone number:", phoneToUse);
        return { success: false, error: "Invalid phone number" };
      }

      await adminSock.sendMessage(jid, { text });
      console.log("📩 User Notification Sent:", jid);

      return {
        success: true,
        to: jid,
        usedWhatsAppNumber: !!(session && session.connected),
      };

    } catch (err) {
      console.error("❌ Error sending user notification:", err.message);
      return { success: false, error: err.message };
    }
  },

  
  sendToUserByPhone: async (phone, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const jid = toJID(phone);
      if (!jid) {
        console.log("❌ Invalid phone number:", phone);
        return { success: false, error: "Invalid phone number" };
      }

      await adminSock.sendMessage(jid, { text });
      console.log("📩 Direct User Notification Sent:", jid);

      return { success: true, to: jid };

    } catch (err) {
      console.error("❌ Error sending user notification:", err.message);
      return { success: false, error: err.message };
    }
  },

 
  sendToAdmin: async (text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const jid = toJID(process.env.ADMIN_PHONE);
      if (!jid) {
        console.log("❌ ADMIN_PHONE missing or invalid");
        return { success: false, error: "ADMIN_PHONE not configured" };
      }

      await adminSock.sendMessage(jid, { text });
      console.log("👑 Admin Notification Sent:", jid);

      return { success: true, to: jid };

    } catch (err) {
      console.error("❌ Error sending admin notification:", err.message);
      return { success: false, error: err.message };
    }
  },

 
  sendBulk: async (userIds, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const results = { success: 0, failed: 0, details: [] };

      for (const userId of userIds) {
        const result = await Notifications.sendToUser(userId, text);

        if (result.success) {
          results.success++;
          results.details.push({ userId, status: "sent", to: result.to });
        } else {
          results.failed++;
          results.details.push({ userId, status: "failed", error: result.error });
        }

        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`📊 Bulk Summary → Sent: ${results.success}, Failed: ${results.failed}`);

      return { success: true, results };

    } catch (err) {
      console.error("❌ Error sending bulk notifications:", err.message);
      return { success: false, error: err.message };
    }
  },
};
