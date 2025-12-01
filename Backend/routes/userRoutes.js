import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import Pricing from "../models/Pricing.js";
import crypto from "crypto";

const router = Router();

// ⭐ SELECT A PLAN
router.post("/select-plan/:planId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const planId = req.params.planId;

    const plan = await Pricing.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Generate API Key
    const apiKey = crypto.randomBytes(20).toString("hex");

    await User.findByIdAndUpdate(userId, {
      activePlan: {
        planId,
        name: plan.name,
        price: plan.price,
        messages: plan.messages,
        features: plan.features,
        activatedAt: new Date(),
        expiryAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        messagesUsed: 0,
        totalMessages: parseInt(plan.messages),
        apiKey,
      },
    });

    res.json({ message: "Plan activated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ⭐ RETURN USER ACTIVE PLAN
router.get("/active-plan", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user.activePlan) return res.json(null);

  res.json(user.activePlan);
});

export default router;
