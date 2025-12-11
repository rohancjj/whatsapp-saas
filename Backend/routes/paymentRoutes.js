import express from "express";

// ✅ Correct uploader import
import { uploadPayment } from "../middlewares/upload.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

import * as razorCtrl from "../controllers/razorpayController.js";
import * as paymentSettingsCtrl from "../controllers/paymentSettingsController.js";
import * as manualPaymentCtrl from "../controllers/manualPaymentController.js";
import * as adminManualCtrl from "../controllers/adminManualPaymentController.js";

const router = express.Router();

/* ============================
      ADMIN PAYMENT SETTINGS
============================ */

// Get Payment Settings
router.get(
  "/admin/payment-settings",
  authMiddleware,
  adminMiddleware,
  paymentSettingsCtrl.getSettings
);

// Update Payment Settings + upload admin QR image
router.put(
  "/admin/payment-settings",
  authMiddleware,
  adminMiddleware,
  uploadPayment.single("qr"),   // << Correct uploader
  (req, res, next) => {
    req.fileUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    next();
  },
  paymentSettingsCtrl.updateSettings
);

/* ============================
      MANUAL PAYMENT ROUTES
============================ */

// User uploads manual payment screenshot
router.post(
  "/payments/manual",
  authMiddleware,
  uploadPayment.single("screenshot"), // << Correct uploader
  (req, res, next) => {

    // Auto-extract planId if missing
    if (!req.body.planId || req.body.planId === "undefined") {
      req.body.planId = req.query.planId || req.headers["x-plan-id"];
    }

    req.fileUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    next();
  },
  manualPaymentCtrl.createManualPayment
);

// Get manual payments for logged-in user
router.get(
  "/payments/manual",
  authMiddleware,
  manualPaymentCtrl.listUserPayments
);

// Get latest payment status
router.get(
  "/payments/status",
  authMiddleware,
  manualPaymentCtrl.getLatestStatus
);

/* ============================
      ADMIN MANUAL PAYMENTS
============================ */

router.get(
  "/admin/manual-payments",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.listPayments
);

router.post(
  "/admin/manual-payments/:id/approve",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.approvePayment
);

router.post(
  "/admin/manual-payments/:id/reject",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.rejectPayment
);

router.delete(
  "/admin/manual-payments/:id",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.deletePayment
);

/* ============================
      RAZORPAY
============================ */

router.get("/payment-settings", paymentSettingsCtrl.getSettings);

router.post("/razorpay/order", authMiddleware, razorCtrl.createOrder);
router.post("/razorpay/verify", authMiddleware, razorCtrl.verifyPayment);

export default router;
