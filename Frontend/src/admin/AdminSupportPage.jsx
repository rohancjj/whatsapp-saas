import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Send,
  RefreshCw,
  Paperclip,
} from "lucide-react";

export default function AdminSupportPage() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:8080/api/v1/support",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load all tickets
  const loadRequests = async () => {
    try {
      setError(null);
      const { data } = await api.get("/admin/all");
      console.log("Loaded requests:", data);
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Admin load error:", err);
      setError(err.response?.data?.message || "Failed to load support requests");
    } finally {
      setLoading(false);
    }
  };

  // Open ticket
  const openRequest = async (id) => {
    try {
      setError(null);
      const { data } = await api.get(`/${id}`);
      console.log("Loaded request details:", data);
      setSelected(data.request);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Open request error:", err);
      setError(err.response?.data?.message || "Failed to load request details");
    }
  };

  // Reply to user
  const sendReply = async () => {
    if (!selected || replyText.trim() === "") {
      alert("Please enter a message");
      return;
    }

    setSending(true);
    try {
      setError(null);
      const formData = new FormData();
      formData.append("text", replyText);

      await api.post(`/${selected._id}/message`, formData);
      
      setReplyText("");
      await openRequest(selected._id);
      await loadRequests(); // Refresh list to update status
    } catch (err) {
      console.error("Reply error:", err);
      setError(err.response?.data?.message || "Failed to send reply");
      alert("Failed to send reply: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  // Change status (approve/resolve/reject/close)
  const changeStatus = async (status) => {
    if (!selected) return;

    try {
      setError(null);
      await api.post(`/admin/${selected._id}/status`, { status });
      
      await loadRequests();
      await openRequest(selected._id);
      
      alert(`Request ${status === "resolved" ? "approved" : status === "closed" ? "rejected" : status}`);
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.response?.data?.message || "Failed to update status");
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // Dynamic status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      open: { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock size={14} /> },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertCircle size={14} /> },
      resolved: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle size={14} /> },
      closed: { bg: "bg-gray-200", text: "text-gray-700", icon: <XCircle size={14} /> },
    };

    const s = styles[status] || styles.open;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {status.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Support Requests</h2>
          <p className="text-gray-600 mt-1">Manage user support tickets</p>
        </div>
        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT SIDE - LIST */}
        <div className="col-span-1 bg-white p-4 rounded-2xl border border-gray-200">
          <h4 className="font-semibold mb-3">All Requests ({requests.length})</h4>

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No support requests found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r._id}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selected?._id === r._id 
                      ? "bg-gray-50 border-black" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => openRequest(r._id)}
                >
                  <div className="font-medium text-gray-900 mb-1">{r.subject}</div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-gray-500">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.userId?.name && (
                    <div className="text-xs text-gray-500 mt-1">
                      by {r.userId.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - DETAILS */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-200">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Request Selected</h3>
              <p className="text-gray-500">Select a support request from the list to view details</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{selected.subject}</h3>
                  <StatusBadge status={selected.status} />
                </div>

                {selected.description && (
                  <p className="text-sm text-gray-600 mb-3">{selected.description}</p>
                )}

                {/* Assigned admin */}
                {selected.assignedTo ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <UserCheck size={16} /> Assigned to Admin
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Not assigned</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  disabled={selected.status === "resolved"}
                  onClick={() => changeStatus("resolved")}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  Approve / Resolve
                </button>

                <button
                  disabled={selected.status === "closed"}
                  onClick={() => changeStatus("closed")}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  <XCircle size={18} />
                  Reject / Close
                </button>
              </div>

              {/* Messages */}
              <div className="max-h-[400px] overflow-y-auto space-y-3 mb-4 p-2">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No messages yet...</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`p-4 rounded-lg ${
                        m.senderRole === "admin" ? "bg-gray-100 ml-12" : "bg-blue-50 mr-12"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-900">
                          {m.senderRole === "admin" ? "Admin (You)" : "User"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{m.text}</p>
                      
                      {m.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={`http://localhost:8080${attachment}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              <Paperclip size={12} />
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Reply box */}
              <div className="border-t border-gray-200 pt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  placeholder="Write a reply to the user..."
                  rows={3}
                  disabled={sending}
                />

                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}