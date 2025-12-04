import express from "express";
import { upload } from "../middlewares/upload.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

// Controllers
import * as paymentSettingsCtrl from "../controllers/paymentSettingsController.js";
import * as manualPaymentCtrl from "../controllers/manualPaymentController.js";
import * as adminManualCtrl from "../controllers/adminManualPaymentController.js";

const router = express.Router();

/* ---------------------------------------------------------
   ADMIN PAYMENT SETTINGS
--------------------------------------------------------- */

// GET current payment settings
router.get(
  "/admin/payment-settings",
  authMiddleware,
  adminMiddleware,
  paymentSettingsCtrl.getSettings
);
router.get(
  "/admin/manual-payments",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.listPayments
);


// UPDATE payment settings
router.put(
  "/admin/payment-settings",
  authMiddleware,
  adminMiddleware,
  upload.single("qr"),
  (req, res, next) => {
    req.fileUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    next();
  },
  paymentSettingsCtrl.updateSettings
);

/* ---------------------------------------------------------
   USER MANUAL PAYMENTS
--------------------------------------------------------- */

// Create manual payment
router.post(
  "/payments/manual",
  authMiddleware,
  upload.single("screenshot"),
  (req, res, next) => {
    // FIX: Ensure formData text values are properly available
    if (req.body.planId === "undefined" || !req.body.planId) {
      req.body.planId = req.query.planId || req.headers["x-plan-id"];
    }

    req.fileUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    next();
  },
  manualPaymentCtrl.createManualPayment
);


// List user's manual payments
router.get(
  "/payments/manual",
  authMiddleware,
  manualPaymentCtrl.listUserPayments
);

/* ---------------------------------------------------------
   ADMIN MANUAL PAYMENT MANAGEMENT
--------------------------------------------------------- */

// List all manual payments
/* USER-SAFE PAYMENT SETTINGS */
router.get("/payment-settings", paymentSettingsCtrl.getSettings);


// Approve payment
router.post(
  "/admin/manual-payments/:id/approve",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.approvePayment
);

// Reject payment
router.post(
  "/admin/manual-payments/:id/reject",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.rejectPayment
);

// Delete payment
router.delete(
  "/admin/manual-payments/:id",
  authMiddleware,
  adminMiddleware,
  adminManualCtrl.deletePayment
);

export default router;
