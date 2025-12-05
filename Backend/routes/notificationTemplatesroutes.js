import express from "express";
import NotificationTemplate from "../models/NotificationTemplate.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";

const router = express.Router();


const normalizeEvent = (systemEvent) => {
  return (!systemEvent || systemEvent === "null" || systemEvent === "") 
    ? null 
    : systemEvent;
};


router.post("/", async (req, res) => {
  try {
    let { name, category, content, variables, systemEvent } = req.body;

    systemEvent = normalizeEvent(systemEvent);

   
    if (systemEvent) {
      const exists = await NotificationTemplate.findOne({ systemEvent });
      if (exists) {
        return res.status(400).json({
          success: false,
          error: `A template already exists for system event: ${systemEvent}`
        });
      }
    }

    const template = await NotificationTemplate.create({
      name,
      category: category?.trim().toLowerCase() || "general",
      content,
      variables: variables || [],
      systemEvent
    });

    res.status(201).json({ success: true, template });
  } catch (err) {
    console.error("❌ Error creating template:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    let { name, category, content, variables, systemEvent } = req.body;

    systemEvent = normalizeEvent(systemEvent);


    if (systemEvent) {
      const exists = await NotificationTemplate.findOne({
        systemEvent,
        _id: { $ne: req.params.id } 
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          error: `Another template already exists for system event: ${systemEvent}`
        });
      }
    }

    const updated = await NotificationTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category: category?.trim().toLowerCase(),
        content,
        variables,
        systemEvent
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    res.json({ success: true, template: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }
    res.json({ success: true, message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
