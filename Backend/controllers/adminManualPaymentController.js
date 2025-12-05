import ManualPayment from "../models/ManualPayment.js";
import User from "../models/User.js";
import Pricing from "../models/Pricing.js";
import mongoose from "mongoose";
import { Notifications } from "../services/sendNotification.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";


export const listPayments = async (req, res) => {
  try {
    const { status = "pending", page = 1, q, userId } = req.query;

    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
          message: "Invalid user ID format",
          receivedUserId: userId 
        });
      }
      filter.userId = userId;
    }

    if (status !== "all") filter.status = status;

    if (q) {
      filter.$or = [{ note: new RegExp(q, "i") }];
    }

    const limit = 20;

    const payments = await ManualPayment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "fullName email phone")
      .populate("planId", "name price messages");

    res.json({ payments });

  } catch (err) {
    console.error("❌ Error loading manual payments:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};



export const approvePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await ManualPayment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== "pending") {
      return res.status(400).json({ message: `Payment already ${payment.status}` });
    }

    const plan = await Pricing.findById(payment.planId);
    if (!plan) return res.status(400).json({ message: "Associated plan not found" });

    const user = await User.findById(payment.userId);
    if (!user) return res.status(400).json({ message: "User not found for this payment" });

    const now = new Date();
    const apiKey = user?.activePlan?.apiKey || `wa_${Math.random().toString(36).slice(2)}`;

    const baseDate =
      user?.activePlan?.expiryAt && new Date(user.activePlan.expiryAt) > now
        ? new Date(user.activePlan.expiryAt)
        : now;

    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedMessages =
      (user.activePlan?.totalMessages || 0) -
      (user.activePlan?.messagesUsed || 0) +
      parseInt(plan.messages);

    user.activePlan = {
      planId: plan._id,
      name: plan.name,
      apiKey,
      totalMessages: updatedMessages,
      messagesUsed: 0,
      activatedAt: now,
      expiryAt: newExpiry,
    };

    await user.save();

    payment.status = "approved";
    payment.updatedAt = now;
    await payment.save();

    // 🎯 Send Template Instead of Hardcoded Message
    await Notifications.sendSystemTemplate(user._id, SYSTEM_EVENTS.PAYMENT_APPROVED, {
      plan: plan.name,
      expiry: newExpiry.toDateString(),
      amount: plan.price,
    });

    res.json({
      message: "Payment approved successfully",
      payment,
      updatedUserPlan: user.activePlan,
    });

  } catch (err) {
    console.error("🔥 APPROVE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const rejectPayment = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const { adminNote } = req.body;

    const payment = await ManualPayment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== "pending") {
      return res.status(400).json({ message: `Payment already ${payment.status}` });
    }

    payment.status = "rejected";
    payment.adminNote = adminNote || "Payment rejected by admin";
    payment.updatedAt = new Date();
    await payment.save();

    // 🎯 Notify user with Template
    await Notifications.sendSystemTemplate(payment.userId, SYSTEM_EVENTS.PAYMENT_REJECTED, {
      reason: adminNote || "Contact support for help.",
    });

    res.json({ message: "Payment rejected", payment });

  } catch (err) {
    console.error("❌ Reject Payment Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};



export const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await ManualPayment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await ManualPayment.findByIdAndDelete(id);
    res.json({ message: "Payment deleted successfully" });

  } catch (err) {
    console.error("❌ Delete Payment Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
