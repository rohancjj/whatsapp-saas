import { getAdminSock } from "./adminWhatsapp.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import User from "../models/User.js";
import NotificationTemplate from "../models/NotificationTemplate.js";

import { toJID } from "../utils/phoneUtils.js";
import { applyTemplate } from "../utils/templateEngine.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";


export const Notifications = {

 
  _getUserPhone: async (userId) => {
 
    const session = await WhatsAppSession.findOne({ userId });

    if (session && session.connected && session.phoneNumber) {
      console.log(`✅ Using connected WhatsApp number: ${session.phoneNumber}`);
      return { phone: session.phoneNumber, usedWhatsAppNumber: true };
    }

    const user = await User.findById(userId);
    if (user && user.phone) {
      console.log(`⚠️ WhatsApp not connected, using signup phone: ${user.phone}`);
      return { phone: user.phone, usedWhatsAppNumber: false };
    }

    console.log("❌ No phone number found for user:", userId);
    return { phone: null, usedWhatsAppNumber: false };
  },

  sendToUser: async (userId, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const { phone, usedWhatsAppNumber } = await Notifications._getUserPhone(userId);
      if (!phone) {
        return { success: false, error: "No phone number available" };
      }

      const jid = toJID(phone);
      if (!jid) {
        console.log("❌ Invalid phone number:", phone);
        return { success: false, error: "Invalid phone number" };
      }

      await adminSock.sendMessage(jid, { text });
      console.log("📩 User Notification Sent:", jid);

      return {
        success: true,
        to: jid,
        usedWhatsAppNumber,
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

  
  sendTemplateToUser: async (userId, templateName, variables = {}) => {
    try {
      
      const template = await NotificationTemplate.findOne({ name: templateName });
      if (!template) {
        console.log("❌ Template not found:", templateName);
        return { success: false, error: "Template not found" };
      }

    
      const user = await User.findById(userId);
      if (!user) {
        console.log("❌ User not found:", userId);
        return { success: false, error: "User not found" };
      }

     
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      
      const { phone, usedWhatsAppNumber } = await Notifications._getUserPhone(userId);
      if (!phone) {
        return { success: false, error: "No phone number available" };
      }

      const jid = toJID(phone);
      if (!jid) {
        console.log("❌ Invalid phone number:", phone);
        return { success: false, error: "Invalid phone number" };
      }

      
      const text = applyTemplate(template.content, {
        name: user.fullName,
        phone: user.phone,
        email: user.email,
        ...variables, 
      });

    
      await adminSock.sendMessage(jid, { text });
      console.log(`📩 Template "${templateName}" sent to`, jid);

      return {
        success: true,
        to: jid,
        usedWhatsAppNumber,
        template: templateName,
      };

    } catch (err) {
      console.error("❌ Error sending template notification:", err.message);
      return { success: false, error: err.message };
    }
  },


  sendTemplateToAllUsers: async (templateName, variablesForUser = {}) => {
   
    try {
      const users = await User.find({});
      const results = { success: 0, failed: 0, details: [] };

      for (const user of users) {
        const perUserVars =
          variablesForUser[user._id?.toString()] || variablesForUser || {};

        const result = await Notifications.sendTemplateToUser(
          user._id,
          templateName,
          perUserVars
        );

        if (result.success) {
          results.success++;
          results.details.push({ userId: user._id, status: "sent", to: result.to });
        } else {
          results.failed++;
          results.details.push({ userId: user._id, status: "failed", error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(
        `📊 Bulk Template "${templateName}" → Sent: ${results.success}, Failed: ${results.failed}`
      );
      return { success: true, results };

    } catch (err) {
      console.error("❌ Error sending bulk template notifications:", err.message);
      return { success: false, error: err.message };
    }
  },

  sendManualToAllUsers: async (text) => {
    try {
      const users = await User.find({});
      const results = { success: 0, failed: 0, details: [] };

      for (const user of users) {
        const result = await Notifications.sendToUser(user._id, text);

        if (result.success) {
          results.success++;
          results.details.push({ userId: user._id, status: "sent", to: result.to });
        } else {
          results.failed++;
          results.details.push({ userId: user._id, status: "failed", error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`📊 Manual Bulk → Sent: ${results.success}, Failed: ${results.failed}`);
      return { success: true, results };

    } catch (err) {
      console.error("❌ Error sending manual bulk notifications:", err.message);
      return { success: false, error: err.message };
    }
  },



  sendSystemTemplate: async (userId, systemEvent, variables = {}) => {
    try {
      const template = await NotificationTemplate.findOne({ systemEvent });

      if (!template) {
        console.log(`⚠️ No template mapped for system event: ${systemEvent}`);
        // optional: fallback basic message instead of failing silently
        return {
          success: false,
          error: `No template assigned to ${systemEvent}`,
        };
      }

      return await Notifications.sendTemplateToUser(
        userId,
        template.name,
        variables
      );
    } catch (err) {
      console.error("❌ Error in sendSystemTemplate:", err.message);
      return { success: false, error: err.message };
    }
  },
};



