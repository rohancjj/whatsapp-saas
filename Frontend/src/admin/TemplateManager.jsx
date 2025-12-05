import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState([]);

  // Fake mock preview values
  const mockData = {
    name: "Rohan",
    plan: "Premium",
    expiry: "10 Jan 2026",
    offer: "50% Discount",
    code: "NEW50"
  };

  // Load templates
  const fetchTemplates = async () => {
    const res = await axios.get("http://localhost:8080/api/notification-templates");
    setTemplates(res.data.templates);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Detect variables automatically from {{variable}}
  useEffect(() => {
    const detected = [
      ...new Set(content.match(/{{(.*?)}}/g)?.map((v) => v.replace(/[{}]/g, "").trim())),
    ];
    setVariables(detected || []);
  }, [content]);

  // Apply template for preview
  const applyTemplate = (text, data) =>
    text.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || `[${key.trim()}]`);

  // Open modal for add/edit
  const openForm = (template = null) => {
    if (template) {
      setEditing(template);
      setName(template.name);
      setCategory(template.category);
      setContent(template.content);
    } else {
      setEditing(null);
      setName("");
      setCategory("");
      setContent("");
    }
    setShowForm(true);
  };

  // Save template
  const handleSave = async () => {
    const payload = { name, category, content, variables };
    if (editing?._id) {
      await axios.put(`http://localhost:8080/api/notification-templates/${editing._id}`, payload);
    } else {
      await axios.post(`http://localhost:8080/api/notification-templates`, payload);
    }
    setShowForm(false);
    fetchTemplates();
  };

  // Delete template
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    await axios.delete(`http://localhost:8080/api/notification-templates/${id}`);
    fetchTemplates();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">📩 Notification Templates</h1>
        <button
          onClick={() => openForm(null)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + New Template
        </button>
      </div>

      {/* Template Table */}
      <table className="w-full border-collapse border text-sm">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="border p-2 text-left">Template Name</th>
            <th className="border p-2 text-left">Category</th>
            <th className="border p-2 text-center">Updated</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates?.length > 0 ? (
            templates.map((t) => (
              <tr key={t._id} className="hover:bg-gray-50">
                <td className="border p-2">{t.name}</td>
                <td className="border p-2">{t.category}</td>
                <td className="border p-2 text-center">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => openForm(t)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border p-4 text-center text-gray-500" colSpan="4">
                No Templates Available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 w-full max-w-lg rounded shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? "✏️ Edit Template" : "➕ Create Template"}
            </h2>

            <label className="block text-sm font-medium mb-1">Template Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded mb-3"
              placeholder="welcome_user, offer_launch..."
            />

            <label className="block text-sm font-medium mb-1">Category *</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded mb-3"
              placeholder="onboarding, offer, subscription..."
            />

            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border p-3 rounded h-40"
              placeholder="Hey {{name}}, welcome 🎉"
            />

            <div className="text-xs text-gray-600 mt-2">
              <strong>Variables Detected:</strong>{" "}
              {variables.length ? variables.join(", ") : "None"}
            </div>

            {/* Preview */}
            <div className="border rounded p-3 bg-gray-50 mt-4">
              <h3 className="font-semibold mb-2">Preview Output 👇</h3>
              <p className="whitespace-pre-wrap text-gray-700">
                {applyTemplate(content, mockData)}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
