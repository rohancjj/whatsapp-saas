import express from "express";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ============================================================
   ROLE CHECK: ONLY ADMIN CAN ACCESS THESE ROUTES
============================================================ */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied: Admin Only" });
  }
  next();
};

/* ============================================================
   1️⃣ MAIN ADMIN DASHBOARD STATS API
============================================================ */
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const activeAPIKeys = await User.countDocuments({
      "activePlan.apiKey": { $exists: true, $ne: null }
    });

    const connectedUsers = await WhatsAppSession.countDocuments({ connected: true });
    const disconnectedUsers = await WhatsAppSession.countDocuments({ connected: false });

    // Total message usage across all users
    const msgAgg = await User.aggregate([
      { $group: { _id: null, used: { $sum: "$activePlan.messagesUsed" } } }
    ]);

    const totalMessagesUsed = msgAgg?.[0]?.used || 0;

    // Messages left
    const msgLeftAgg = await User.aggregate([
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
    const totalMessagesLeft = msgLeftAgg?.[0]?.left || 0;

    // Recent Users (last 7 days)
    const lastWeekUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      activeAPIKeys,
      connectedUsers,
      disconnectedUsers,
      totalMessagesUsed,
      totalMessagesLeft,
      recentUsers: lastWeekUsers,

      revenue: 0, // Replace after adding payment integration

      system: {
        serverStatus: "online",
        apiLatency: Math.floor(Math.random() * 200) + 100, // dummy value
      }
    });

  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================================================
   2️⃣ GET ALL USERS + PLAN + API KEY + WA SESSION
============================================================ */
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
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,

      activePlan: u.activePlan
        ? {
            planId: u.activePlan.planId,
            activatedAt: u.activePlan.activatedAt,
            expiryAt: u.activePlan.expiryAt,
            messagesUsed: u.activePlan.messagesUsed,
            totalMessages: u.activePlan.totalMessages,
            apiKey: u.activePlan.apiKey,
          }
        : null,

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

/* ============================================================
   3️⃣ GET SPECIFIC USER DETAILS
============================================================ */
router.get("/user/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    const session = await WhatsAppSession.findOne({ userId: user._id });

    return res.json({
      user,
      whatsapp: session || null
    });
  } catch (err) {
    console.error("Admin Get User Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   4️⃣ FILTER CONNECTED USERS
============================================================ */
router.get("/connected-users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const sessions = await WhatsAppSession.find({ connected: true });
    res.json(sessions);
  } catch (err) {
    console.error("Connected users error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================================================
   5️⃣ FILTER DISCONNECTED USERS
============================================================ */
router.get("/disconnected-users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const sessions = await WhatsAppSession.find({ connected: false });
    res.json(sessions);
  } catch (err) {
    console.error("Disconnected users error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================================================
   6️⃣ FORCE DISCONNECT USER (Admin Action)
============================================================ */
router.post("/disconnect/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await WhatsAppSession.findOneAndUpdate(
      { userId: req.params.userId },
      { connected: false }
    );

    return res.json({ message: "User disconnected successfully" });
  } catch (err) {
    console.error("Admin disconnect error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
