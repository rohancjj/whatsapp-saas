import ManualPayment from "../models/ManualPayment.js";
import User from "../models/User.js";
import Pricing from "../models/Pricing.js";
import crypto from "crypto";
import { Notifications } from "../services/sendNotification.js";

/* ======================================================
   LIST PAYMENTS
====================================================== */
export const listPayments = async (req, res) => {
  const { status = "pending", page = 1, q } = req.query;
  const filter = {};
  if (status !== "all") filter.status = status;
  if (q) filter.$or = [{ userId: q }, { note: new RegExp(q, "i") }];

  const limit = 30;
  const payments = await ManualPayment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("userId", "fullName email phone")
    .populate("planId", "name price messagesPerMonth");

  res.json({ payments });
};

/* ======================================================
   APPROVE PAYMENT → Activate selected plan
====================================================== */
export const approvePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const payment = await ManualPayment.findById(id);

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Fetch plan info
    const plan = await Pricing.findById(payment.planId);
    if (!plan) return res.status(400).json({ message: "Plan not found" });

    // Activate plan for user
    const user = await User.findById(payment.userId);

    const apiKey = user?.activePlan?.apiKey || `wa_${crypto.randomBytes(16).toString("hex")}`;

    user.activePlan = {
      planId: plan._id,
      name: plan.name,
      apiKey,
      totalMessages: plan.messagesPerMonth,
      messagesUsed: 0,
      activatedAt: new Date(),
      expiryAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    await user.save();

    // Update payment status
    payment.status = "approved";
    payment.updatedAt = new Date();
    await payment.save();

    // Notify user
    await Notifications.sendToUser(
      payment.userId,
      `🎉 Your payment is approved! Your plan "${plan.name}" is now active.\nAPI Key: ${apiKey}`
    );

    res.json({ message: "Payment approved & plan activated.", payment });

  } catch (err) {
    console.error("Approve Payment Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const rejectPayment = async (req, res) => {
  const id = req.params.id;
  const { adminNote } = req.body;

  const payment = await ManualPayment.findById(id);
  if (!payment) return res.status(404).json({ message: "Not found" });

  payment.status = "rejected";
  payment.adminNote = adminNote || "";
  payment.updatedAt = new Date();
  await payment.save();

  await Notifications.sendToUser(
    payment.userId,
    `❌ Payment rejected. Reason: ${adminNote || "Contact support."}`
  );

  res.json({ message: "Rejected", payment });
};


export const deletePayment = async (req, res) => {
  const id = req.params.id;

  const payment = await ManualPayment.findById(id);
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  await ManualPayment.findByIdAndDelete(id);

  res.json({ message: "Payment deleted successfully" });
};
