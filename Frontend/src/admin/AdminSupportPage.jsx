import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Send,
} from "lucide-react";

export default function AdminSupportPage() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:8080/api/v1/support",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load all tickets
  const loadRequests = async () => {
    try {
      const { data } = await api.get("/admin/all");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open ticket
  const openRequest = async (id) => {
    try {
      const { data } = await api.get(`/${id}`);
      setSelected(data.request);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Open request error:", err);
    }
  };

  // Reply to user
  const sendReply = async () => {
    if (!selected || replyText.trim() === "") return;
    try {
      await api.post(`/${selected._id}/message`, { text: replyText });
      setReplyText("");
      openRequest(selected._id);
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  // Approve / Reject
  const changeStatus = async (status) => {
    try {
      await api.post(`/admin/${selected._id}/status`, { status });
      await loadRequests();
      await openRequest(selected._id);
    } catch (err) {
      console.error("Status update error:", err);
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Support Requests</h2>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT SIDE - LIST */}
          <div className="col-span-1 bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-3">All Requests</h4>

            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm">No support requests found.</p>
            ) : (
              requests.map((r) => (
                <div
                  key={r._id}
                  className={`p-3 border-b cursor-pointer rounded mb-1 ${
                    selected?._id === r._id ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={() => openRequest(r._id)}
                >
                  <div className="font-medium">{r.subject}</div>
                  <div className="text-sm mt-1">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT SIDE - DETAILS */}
          <div className="col-span-2 bg-white p-4 rounded shadow">
            {!selected ? (
              <div className="text-gray-500 text-center">Select a request</div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{selected.subject}</h3>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Assigned admin */}
                {selected.assignedTo ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm mb-4">
                    <UserCheck size={16} /> Assigned to Admin
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-4">Not assigned</div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    disabled={selected.status === "resolved"}
                    onClick={() => changeStatus("resolved")}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-green-300"
                  >
                    Approve / Resolve
                  </button>

                  <button
                    disabled={selected.status === "closed"}
                    onClick={() => changeStatus("closed")}
                    className="bg-red-600 text-white px-4 py-2 rounded disabled:bg-red-300"
                  >
                    Reject / Close
                  </button>
                </div>

                {/* Messages */}
                <div className="max-h-[50vh] overflow-auto space-y-3 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet...</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m._id}
                        className={`p-3 rounded ${
                          m.senderRole === "admin" ? "bg-gray-100" : "bg-blue-100"
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {m.senderRole === "admin" ? "Admin" : "User"}
                        </div>
                        <div>{m.text}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply box */}
                <div className="border-t pt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Write a reply..."
                  />

                  <button
                    onClick={sendReply}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    <Send size={16} />
                    Send Reply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
