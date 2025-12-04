import express from "express";
import { upload } from "../middlewares/upload.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

import * as razorCtrl from "../controllers/razorpayController.js"
import * as paymentSettingsCtrl from "../controllers/paymentSettingsController.js";
import * as manualPaymentCtrl from "../controllers/manualPaymentController.js";
import * as adminManualCtrl from "../controllers/adminManualPaymentController.js";

const router = express.Router();


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


router.post(
  "/payments/manual",
  authMiddleware,
  upload.single("screenshot"),
  (req, res, next) => {
    
    if (req.body.planId === "undefined" || !req.body.planId) {
      req.body.planId = req.query.planId || req.headers["x-plan-id"];
    }

    req.fileUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    next();
  },
  manualPaymentCtrl.createManualPayment
);



router.get(
  "/payments/manual",
  authMiddleware,
  manualPaymentCtrl.listUserPayments
);

router.get("/payment-settings", paymentSettingsCtrl.getSettings);



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

router.get(
  "/payments/status",
  authMiddleware,
  manualPaymentCtrl.getLatestStatus
);

router.post("/razorpay/order", authMiddleware, razorCtrl.createOrder);
router.post("/razorpay/verify", authMiddleware, razorCtrl.verifyPayment);



export default router;
