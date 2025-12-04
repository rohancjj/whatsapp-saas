import ManualPayment from "../models/ManualPayment.js";
import User from "../models/User.js";
import { Notifications } from "../services/sendNotification.js";

export const createManualPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, note, currency } = req.body;

    // validate amount
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    // screenshot URL
    const screenshotUrl =
      req.fileUrl ||
      (req.file ? `/uploads/payments/${req.file.filename}` : null);

    if (!screenshotUrl) {
      return res.status(400).json({ message: "Screenshot is required" });
    }

    // Create payment entry
    const payment = await ManualPayment.create({
      userId,
      amount: Number(amount),
      currency: currency || "INR",
      method: "manual",
      note: note || "",
      screenshotUrl,
      status: "pending",
      updatedAt: new Date(),
    });

    // notify admin
    await Notifications.sendToAdmin(
      `🧾 Manual payment submitted\nUser: ${userId}\nAmount: ₹${amount}`
    );

    res.json({ message: "Payment submitted successfully", payment });
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ payments, page });
  } catch (err) {
    console.error("❌ List User Payments Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
