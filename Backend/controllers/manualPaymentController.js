import ManualPayment from "../models/ManualPayment.js";
import Pricing from "../models/Pricing.js";
import User from "../models/User.js";
import { Notifications } from "../services/sendNotification.js";

export const createManualPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, note, currency } = req.body;

   
    if (!planId) {
      return res.status(400).json({ message: "Plan selection is required." });
    }

 
    const plan = await Pricing.findById(planId);
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan selected." });
    }

    
    const screenshotUrl = req.fileUrl || (req.file ? `/uploads/payments/${req.file.filename}` : null);
    if (!screenshotUrl) {
      return res.status(400).json({ message: "Screenshot is required." });
    }

    // Create manual payment request
    const payment = await ManualPayment.create({
      userId,
      planId,
      amount: Number(plan.price),  // Auto-assign amount based on plan
      currency: currency || "INR",
      method: "manual",
      note: note || "",
      screenshotUrl,
      status: "pending",
      updatedAt: new Date(),
    });

    // Notify admin
    await Notifications.sendToAdmin(
      `🧾 Manual Payment Request\n👤 User: ${userId}\n📦 Plan: ${plan.name}\n💰 Amount: ₹${plan.price}\n📥 Status: Pending Approval`
    );

    res.json({
      message: "Payment request submitted. Awaiting admin approval.",
      payment,
    });

  } catch (err) {
    console.error("❌ Manual Payment Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


export const listUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;

    const payments = await ManualPayment.find({ userId })
      .populate("planId", "name price")   
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ payments, page });

  } catch (err) {
    console.error("❌ List User Payments Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
export const getLatestStatus = async (req, res) => {
  try {
    const payment = await ManualPayment.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!payment) return res.json({ status: "no_payment" });

    return res.json({ status: payment.status, planId: payment.planId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};