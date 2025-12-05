import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TemplateManager() {
  const EVENT_OPTIONS = {
    USER_DISCONNECTED: "WhatsApp Disconnected",
    USER_SUSPENDED: "Account Suspended",
    USER_UNSUSPENDED: "Account Unsuspended",
    USER_TERMINATED: "Account Terminated / Banned",
    USER_RESTORED: "Account Restored",
    USER_DELETED: "Account Permanently Deleted",
    PAYMENT_APPROVED: "Payment is approved",
  PAYMENT_REJECTED: "Payment rejected",
  
  USER_SIGNUP: "USER_SIGNUP",
  ADMIN_NEW_USER: "ADMIN_NEW_USER",
  ADMIN_FIRST_LOGIN: "ADMIN_FIRST_LOGIN",
  NEW_PLAN_CREATED: "NEW_PLAN_CREATED",
  
  

  };

  const API = "http://localhost:8080/api/notification-templates";

  const [templates, setTemplates] = useState([]);
  const [usedEvents, setUsedEvents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form fields
  const [systemEvent, setSystemEvent] = useState("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState([]);

  const mockData = {
    name: "Rohan",
    phone: "9999999999",
    plan: "Premium",
    expiry: "12 Jan 2026",
  };

  const fetchTemplates = async () => {
    const res = await axios.get(API);
    setTemplates(res.data.templates);

    const filledEvents = res.data.templates
      .filter((t) => t.systemEvent)
      .map((t) => t.systemEvent);

    setUsedEvents(filledEvents);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const found = [...new Set(content.match(/{{(.*?)}}/g)?.map(v => v.replace(/[{}]/g, "").trim()))];
    setVariables(found || []);
  }, [content]);

  const applyTemplate = (text, data) =>
    text?.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || `[${key.trim()}]`);

  const openForm = (template = null) => {
    setErrorMsg("");

    if (template) {
      setEditing(template);
      setSystemEvent(template.systemEvent || "");
      setContent(template.content || "");
    } else {
      setEditing(null);
      setSystemEvent("");
      setContent("");
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    setErrorMsg("");

    const payload = { 
      name: systemEvent || `custom_${Date.now()}`, 
      systemEvent, 
      content, 
      variables 
    };

    try {
      if (editing) {
        await axios.put(`${API}/${editing._id}`, payload);
      } else {
        await axios.post(API, payload);
      }

      fetchTemplates();
      setShowForm(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "❌ Unexpected error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    await axios.delete(`${API}/${id}`);
    fetchTemplates();
  };

  const missingEvents = Object.keys(EVENT_OPTIONS).filter(
    ev => !usedEvents.includes(ev)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">📨 Notification Templates</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => openForm()} >
          + Create Template
        </button>
      </div>

      {missingEvents.length > 0 && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded mb-4 text-sm">
          ⚠ Missing Templates:
          <strong> {missingEvents.length} system events need templates:</strong>
          <ul className="list-disc pl-5 mt-1">
            {missingEvents.map(e => <li key={e}>{EVENT_OPTIONS[e]}</li>)}
          </ul>
        </div>
      )}

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Trigger</th>
            <th className="p-2 border">Preview</th>
            <th className="p-2 border">Updated</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.length ? templates.map(t => (
            <tr key={t._id} className="hover:bg-gray-50">
              <td className="border p-2">
                {t.systemEvent ? EVENT_OPTIONS[t.systemEvent] : "Custom/Manual Template"}
              </td>
              <td className="border p-2">{applyTemplate(t.content, mockData)}</td>
              <td className="border p-2 text-center">
                {new Date(t.updatedAt).toLocaleString()}
              </td>
              <td className="border p-2 flex justify-center gap-2">
                <button onClick={() => openForm(t)} className="bg-blue-500 px-3 py-1 rounded text-white">
                  Edit
                </button>
                <button onClick={() => handleDelete(t._id)} className="bg-red-500 px-3 py-1 rounded text-white">
                  Delete
                </button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="text-center p-4 text-gray-500">No templates found</td></tr>
          )}
        </tbody>
      </table>

      {/* FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 w-full max-w-lg rounded shadow-lg">

            <h2 className="text-xl font-semibold mb-3">
              {editing ? "✏ Edit Template" : "➕ Create Template"}
            </h2>

            {errorMsg && (
              <div className="p-2 bg-red-100 border border-red-400 text-red-800 rounded mb-3 text-sm">
                ❌ {errorMsg}
              </div>
            )}

            <label className="font-medium">System Event</label>
            <select
              value={systemEvent}
              className="w-full border p-2 mb-2"
              onChange={(e) => setSystemEvent(e.target.value)}
            >
              <option value="">-- Custom / No Trigger --</option>
              {Object.entries(EVENT_OPTIONS).map(([key, label]) => (
                <option 
                  key={key} 
                  value={key}
                  disabled={!editing && usedEvents.includes(key)}
                >
                  {label} {usedEvents.includes(key) ? "(✔ Already Configured)" : ""}
                </option>
              ))}
            </select>

            <label className="font-medium">Message Content</label>
            <textarea
              className="w-full border p-2 h-36 mb-3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <p className="text-xs text-gray-600">🔍 Variables: {variables.join(", ") || "None"}</p>

            <div className="border bg-gray-100 mt-3 p-3 rounded">
              <strong>Preview:</strong>
              <p className="mt-2 whitespace-pre-wrap">{applyTemplate(content, mockData)}</p>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSave}
              >Save</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
