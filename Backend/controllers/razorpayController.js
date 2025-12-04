import crypto from "crypto";
import { razorpay } from "../services/razorpay.js";
import ManualPayment from "../models/ManualPayment.js";

export const createOrder = async (req, res) => {
  try {
    const { amount, planId } = req.body;

    if (!amount || !planId) {
      return res.status(400).json({ success: false, message: "Amount and planId required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // convert ₹ to paise
      currency: "INR",
      receipt: `ORD-${Date.now().toString().slice(-6)}`,

    });

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      planId,
    });

  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await ManualPayment.create({
      userId: req.user.id,
      planId,
      amount,
      method: "razorpay",
      razorpayPaymentId: razorpay_payment_id,
      status: "approved",
    });

    return res.json({ success: true, message: "Payment Verified" });

  } catch (error) {
    console.error("Payment verification failed:", error);
    res.status(500).json({ success: false, message: "Verification error" });
  }
};
