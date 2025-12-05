import express from "express";
import { Notifications } from "../services/sendNotification.js";


const router = express.Router();


router.post("/send/template-to-user", async (req, res) => {
  try {
    const { userId, templateName, variables } = req.body;
    const result = await Notifications.sendTemplateToUser(userId, templateName, variables);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.post("/send/template-to-all", async (req, res) => {
  try {
    const { templateName, variablesForUser } = req.body;
    const result = await Notifications.sendTemplateToAllUsers(templateName, variablesForUser);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.post("/send/manual-to-all", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await Notifications.sendManualToAllUsers(text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
