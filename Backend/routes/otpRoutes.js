// routes/otpRoutes.js
import express from "express";
import * as otpCtrl from "../controllers/otpController.js";

const router = express.Router();

// POST /auth/otp/send
router.post("/send", otpCtrl.sendOtp);

// POST /auth/otp/verify
router.post("/verify", otpCtrl.verifyOtp);

export default router;
