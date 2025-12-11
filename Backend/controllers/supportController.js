// controllers/supportController.js
import SupportRequest from "../models/SupportRequest.js";
import SupportMessage from "../models/SupportMessage.js";
import User from "../models/User.js"; // for lookup / notifications

// helper to build absolute URL for uploaded file
const buildFileUrl = (req, filename) => {
  if (!filename) return null;
  return `/uploads/support/${filename}`;
};

// --- User: create a support request
export const createSupportRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, description, priority, tags } = req.body;

    if (!subject) return res.status(400).json({ message: "Subject is required" });

    const attachments = [];
    if (req.files && req.files.length) {
      for (const f of req.files) attachments.push(buildFileUrl(req, f.filename));
    }

    const reqDoc = await SupportRequest.create({
      userId,
      subject,
      description,
      priority: priority || "low",
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim())) : [],
      attachments,
      status: "open",
    });

    // initial message (optional)
    if (description) {
      await SupportMessage.create({
        requestId: reqDoc._id,
        senderId: userId,
        senderRole: "user",
        text: description,
        attachments,
      });
    }

    // TODO: notify admin(s) via Notifications or socket
    // e.g., Notifications.sendToAdmin(`New support request: ${subject}`);

    res.json({ success: true, request: reqDoc });
  } catch (err) {
    console.error("createSupportRequest:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- User: list own requests
export const listUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await SupportRequest.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, requests });
  } catch (err) {
    console.error("listUserRequests:", err);
    res.status(500).json({ success: false });
  }
};

// --- User: get request and messages
export const getRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const request = await SupportRequest.findById(id).lean();
    if (!request) return res.status(404).json({ message: "Not found" });
    if (request.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await SupportMessage.find({ requestId: id }).sort({ createdAt: 1 }).lean();

    res.json({ success: true, request, messages });
  } catch (err) {
    console.error("getRequest:", err);
    res.status(500).json({ success: false });
  }
};

// --- User/Admin: add message to request (reply)
export const addMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = !!req.user.isAdmin;
    const { requestId } = req.params;
    const { text } = req.body;

    const request = await SupportRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // permission: user must own the request unless admin
    if (!isAdmin && request.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const attachments = [];
    if (req.files && req.files.length) {
      for (const f of req.files) attachments.push(buildFileUrl(req, f.filename));
    }

    const msg = await SupportMessage.create({
      requestId,
      senderId: userId,
      senderRole: isAdmin ? "admin" : "user",
      text: text || "",
      attachments,
    });

    // Update request status & updatedAt
    request.status = isAdmin ? "pending" : "open";
    request.updatedAt = new Date();
    if (isAdmin && !request.assignedTo) request.assignedTo = userId;
    await request.save();

    // Emit socket event to notify the other side (implementation below)
    // req.app.get('io')?.to(<room>).emit('support_update', { requestId, msg });

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error("addMessage:", err);
    res.status(500).json({ success: false });
  }
};

// --- Admin: list all requests, with optional filters
export const adminListRequests = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const q = {};
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (assignedTo) q.assignedTo = assignedTo;

    const requests = await SupportRequest.find(q).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, requests });
  } catch (err) {
    console.error("adminListRequests:", err);
    res.status(500).json({ success: false });
  }
};

// --- Admin: change status (approve/resolve/close)
export const adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["open", "pending", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const reqDoc = await SupportRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: "Not found" });

    reqDoc.status = status;
    reqDoc.updatedAt = new Date();
    await reqDoc.save();

    // Optionally notify user
    // Notifications.sendToUser(reqDoc.userId, `Your support request ${reqDoc.subject} is now ${status}`);

    res.json({ success: true, request: reqDoc });
  } catch (err) {
    console.error("adminUpdateStatus:", err);
    res.status(500).json({ success: false });
  }
};

// --- Admin: assign admin to a request
export const adminAssign = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const doc = await SupportRequest.findById(id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    doc.assignedTo = adminId;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, request: doc });
  } catch (err) {
    console.error("adminAssign:", err);
    res.status(500).json({ success: false });
  }
};
