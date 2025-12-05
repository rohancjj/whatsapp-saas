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

    if (session?.connected && session?.phoneNumber) {
      console.log(`✅ Using connected WhatsApp number: ${session.phoneNumber}`);
      return { phone: session.phoneNumber, usedWhatsAppNumber: true };
    }

    const user = await User.findById(userId);
    if (user?.phone) {
      console.log(`⚠️ Using user's signup phone: ${user.phone}`);
      return { phone: user.phone, usedWhatsAppNumber: false };
    }

    console.log("❌ No phone number found:", userId);
    return { phone: null, usedWhatsAppNumber: false };
  },

  /* ============================
     📩 Send Plain Message
  ============================= */
  sendToUser: async (userId, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock?.user) return { success: false, error: "Admin WhatsApp not connected" };

      const { phone } = await Notifications._getUserPhone(userId);
      if (!phone) return { success: false, error: "No phone number available" };

      const jid = toJID(phone);
      if (!jid) return { success: false, error: "Invalid phone number" };

      await adminSock.sendMessage(jid, { text });
      console.log(`📩 Message Sent →`, jid);

      return { success: true, to: jid };

    } catch (err) {
      console.error("❌ sendToUser Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     📩 Send Message via Phone Only
  ============================= */
  sendToUserByPhone: async (phone, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock?.user) return { success: false, error: "Admin WhatsApp not connected" };

      const jid = toJID(phone);
      if (!jid) return { success: false, error: "Invalid phone number" };

      await adminSock.sendMessage(jid, { text });
      console.log(`📩 Direct Message Sent →`, jid);

      return { success: true, to: jid };

    } catch (err) {
      console.error("❌ sendToUserByPhone Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     👑 Send To Admin
  ============================= */
  sendToAdmin: async (text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock?.user) return { success: false, error: "Admin WhatsApp not connected" };

      const jid = toJID(process.env.ADMIN_PHONE);
      if (!jid) return { success: false, error: "ADMIN_PHONE missing/invalid" };

      await adminSock.sendMessage(jid, { text });
      console.log(`👑 Admin Message Sent →`, jid);

      return { success: true, to: jid };

    } catch (err) {
      console.error("❌ sendToAdmin Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     📤 Send Template to One User
  ============================= */
  sendTemplateToUser: async (userId, templateName, variables = {}) => {
    try {
      const template = await NotificationTemplate.findOne({ name: templateName });
      if (!template) return { success: false, error: "Template not found" };

      const user = await User.findById(userId);
      if (!user) return { success: false, error: "User not found" };

      const adminSock = getAdminSock();
      if (!adminSock?.user) return { success: false, error: "Admin WhatsApp not connected" };

      const { phone } = await Notifications._getUserPhone(userId);
      if (!phone) return { success: false, error: "No phone number available" };

      const jid = toJID(phone);
      if (!jid) return { success: false, error: "Invalid phone number" };

      const text = applyTemplate(template.content, {
        name: user.fullName,
        phone: user.phone,
        email: user.email,
        ...variables,
      });

      await adminSock.sendMessage(jid, { text });

      console.log(`📨 Template Sent → ${templateName} → ${jid}`);
      return { success: true, to: jid, template: templateName };

    } catch (err) {
      console.error("❌ sendTemplateToUser Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     📤 Send Template to All Users
  ============================= */
  sendTemplateToAllUsers: async (templateName, variables = {}) => {
    try {
      const users = await User.find({});
      let sent = 0;

      for (const user of users) {
        await Notifications.sendTemplateToUser(user._id, templateName, variables);
        sent++;

        await new Promise(res => setTimeout(res, 800)); // rate limit
      }

      return { success: true, sent };

    } catch (err) {
      console.error("❌ sendTemplateToAllUsers Error:", err);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     🏷 Send Event Template
  ============================= */
  sendSystemTemplate: async (userId, systemEvent, variables = {}) => {
    try {
      const template = await NotificationTemplate.findOne({ systemEvent });

      if (!template) {
        console.log(`⚠️ No template assigned → ${systemEvent}`);
        return { success: false, error: `No template assigned to ${systemEvent}` };
      }

      return await Notifications.sendTemplateToUser(userId, template.name, variables);

    } catch (err) {
      console.error("❌ sendSystemTemplate Error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /* ============================
     🚀 NEW: Send System Event to All
  ============================= */
  sendSystemTemplateToAll: async (systemEvent, variables = {}) => {
    try {
      const template = await NotificationTemplate.findOne({ systemEvent });
      if (!template) return { success: false, error: "Template missing for event" };

      const users = await User.find({});
      let count = 0;

      for (const user of users) {
        await Notifications.sendTemplateToUser(user._id, template.name, variables);
        count++;

        await new Promise(res => setTimeout(res, 800)); // prevent WhatsApp block
      }

      console.log(`📢 Broadcast Complete → ${systemEvent} → ${count} users`);

      return { success: true, sent: count };

    } catch (err) {
      console.error("❌ sendSystemTemplateToAll Error:", err.message);
      return { success: false, error: err.message };
    }
  },
  sendSystemTemplateToAdmin: async (systemEvent, variables = {}) => {
  try {
    const template = await NotificationTemplate.findOne({ systemEvent });

    if (!template) {
      console.log(`⚠️ No template assigned for admin event: ${systemEvent}`);
      return {
        success: false,
        error: `No template assigned to ${systemEvent}`,
      };
    }

    const adminSock = getAdminSock();
    if (!adminSock?.user) {
      console.log("❌ Admin WhatsApp not connected.");
      return { success: false, error: "Admin WhatsApp not connected" };
    }

    const jid = toJID(process.env.ADMIN_PHONE);
    if (!jid) return { success: false, error: "ADMIN_PHONE invalid or missing" };

    const text = applyTemplate(template.content, {
      name: variables.name,
      email: variables.email,
      phone: variables.phone,
      ...variables,
    });

    await adminSock.sendMessage(jid, { text });

    console.log(`👑 Admin Template (${systemEvent}) sent → ${jid}`);

    return { success: true, to: jid };

  } catch (err) {
    console.error("❌ sendSystemTemplateToAdmin Error:", err.message);
    return { success: false, error: err.message };
  }
},

};
