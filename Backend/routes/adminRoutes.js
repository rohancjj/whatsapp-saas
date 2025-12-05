import express from "express";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getUserSock } from "../services/whatsappManager.js";
import { Notifications } from "../services/sendNotification.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied: Admin Only" });
  }
  next();
};

/* ================================
   📊 ADMIN DASHBOARD STATS
================================ */
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeAPIKeys = await User.countDocuments({
      "activePlan.apiKey": { $exists: true, $ne: null }
    });

    const connectedUsers = await WhatsAppSession.countDocuments({ connected: true });
    const disconnectedUsers = await WhatsAppSession.countDocuments({ connected: false });

    const msgUsed = await User.aggregate([
      { $group: { _id: null, used: { $sum: "$activePlan.messagesUsed" } } }
    ]);

    const msgLeft = await User.aggregate([
      {
        $group: {
          _id: null,
          left: {
            $sum: {
              $subtract: ["$activePlan.totalMessages", "$activePlan.messagesUsed"]
            }
          }
        }
      }
    ]);

    const lastWeekUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      activeAPIKeys,
      connectedUsers,
      disconnectedUsers,
      totalMessagesUsed: msgUsed?.[0]?.used || 0,
      totalMessagesLeft: msgLeft?.[0]?.left || 0,
      recentUsers: lastWeekUsers,
      system: {
        serverStatus: "online",
        apiLatency: Math.floor(Math.random() * 150) + 80,
      }
    });

  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ================================
   👥 GET ALL USERS
================================ */
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const sessions = await WhatsAppSession.find();

    const sessionMap = {};
    sessions.forEach((s) => {
      sessionMap[s.userId] = {
        apiKey: s.apiKey,
        phone: s.phoneNumber,
        connected: s.connected,
        updatedAt: s.updatedAt
      };
    });

    const final = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      suspended: Boolean(u.suspended),
      terminated: Boolean(u.terminated),
      activePlan: u.activePlan,
      whatsapp: sessionMap[u._id] || {
        apiKey: null,
        connected: false,
        phone: null
      },
    }));

    res.json(final);

  } catch (err) {
    console.error("Admin Users Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ================================
   🔌 DISCONNECT USER WHATSAPP
================================ */
router.post("/disconnect/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.params.userId;
    const sock = getUserSock(userId);

    if (sock) try { await sock.logout(); } catch {}

    await WhatsAppSession.updateOne({ userId }, { connected: false });

    await Notifications.sendSystemTemplate(userId, SYSTEM_EVENTS.USER_DISCONNECTED);

    res.json({ message: "User WhatsApp disconnected" });

  } catch (err) {
    console.error("Disconnect error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   ⛔ SUSPEND USER
================================ */
router.post("/suspend/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { suspended: true });

    await Notifications.sendSystemTemplate(req.params.userId, SYSTEM_EVENTS.USER_SUSPENDED);

    res.json({ message: "User suspended" });

  } catch (err) {
    console.error("Suspend error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   ✔️ UNSUSPEND USER
================================ */
router.post("/unsuspend/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { suspended: false });

    await Notifications.sendSystemTemplate(req.params.userId, SYSTEM_EVENTS.USER_UNSUSPENDED);

    res.json({ message: "User unsuspended" });

  } catch (err) {
    console.error("Unsuspend error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   🚫 TERMINATE USER (Ban)
================================ */
router.post("/terminate/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.params.userId;
    const sock = getUserSock(userId);

    if (sock) try { await sock.logout(); } catch {}

    await WhatsAppSession.findOneAndDelete({ userId });

    await User.findByIdAndUpdate(userId, {
      terminated: true,
      suspended: true,
      activePlan: {}
    });

    await Notifications.sendSystemTemplate(userId, SYSTEM_EVENTS.USER_TERMINATED);

    res.json({ message: "User terminated (banned)" });

  } catch (err) {
    console.error("Terminate error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   🔄 RESTORE USER
================================ */
router.post("/resume/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      terminated: false,
      suspended: false
    });

    await Notifications.sendSystemTemplate(req.params.userId, SYSTEM_EVENTS.USER_RESTORED);

    res.json({ message: "User restored" });

  } catch (err) {
    console.error("Resume error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   🗑️ DELETE USER PERMANENTLY
================================ */
router.delete("/user/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.params.userId;

    const sock = getUserSock(userId);
    if (sock) try { await sock.logout(); } catch {}

    await WhatsAppSession.findOneAndDelete({ userId });
    await User.findByIdAndDelete(userId);

    await Notifications.sendSystemTemplate(userId, SYSTEM_EVENTS.USER_DELETED);

    res.json({ message: "User permanently deleted" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
