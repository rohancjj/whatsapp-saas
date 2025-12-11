import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Send, Paperclip, X, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function UserSupportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState("");
  const [files, setFiles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem("token");

  const loadRequests = async () => {
    try {
      const { data } = await axios.get("http://localhost:8080/api/v1/support", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRequest = async (id) => {
    try {
      const { data } = await axios.get(`http://localhost:8080/api/v1/support/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected(data.request);
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await axios.post("http://localhost:8080/api/v1/support", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadRequests();
      e.target.reset();
      setShowCreateForm(false);
      alert("Support request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    }
  };

  const sendMessage = async () => {
    if (!selected || !newText.trim()) return;

    setSending(true);
    const fd = new FormData();
    fd.append("text", newText);
    if (files.length > 0) {
      files.forEach(file => fd.append("attachments", file));
    }

    try {
      await axios.post(`http://localhost:8080/api/v1/support/${selected._id}/message`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewText("");
      setFiles([]);
      openRequest(selected._id);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock size={14} /> },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertCircle size={14} /> },
      resolved: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle size={14} /> },
      closed: { bg: "bg-gray-100", text: "text-gray-700", icon: <X size={14} /> }
    };
    const style = config[status] || config.open;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
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
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">Get help with your questions and issues</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Support Request</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={createRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                name="subject"
                required
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Please provide detailed information about your issue"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (optional)</label>
              <input
                type="file"
                name="attachments"
                multiple
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-4">Your Requests</h3>
            
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No support requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map(request => (
                  <div
                    key={request._id}
                    onClick={() => openRequest(request._id)}
                    className={`p-3 border border-gray-200 rounded-lg cursor-pointer transition ${
                      selected?._id === request._id ? 'bg-gray-50 border-black' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{request.subject}</div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(request.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Area */}
        <div className="col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{selected.subject}</h2>
                  {getStatusBadge(selected.status)}
                </div>
                <p className="text-sm text-gray-600">{selected.description}</p>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {messages.map(msg => (
                  <div
                    key={msg._id}
                    className={`p-4 rounded-lg ${
                      msg.senderRole === "user"
                        ? "bg-blue-50 ml-12"
                        : "bg-gray-50 mr-12"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-900">
                        {msg.senderRole === "user" ? "You" : "Support Team"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.text}</p>
                    
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment}
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
                ))}
              </div>

              {/* Reply Box */}
              {selected.status !== "closed" && (
                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none mb-3"
                  />

                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                          <Paperclip size={14} />
                          <span>{file.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <Paperclip size={18} />
                      <span className="text-sm font-medium">Attach</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={sendMessage}
                      disabled={sending || !newText.trim()}
                      className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              )}

              {selected.status === "closed" && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">This ticket has been closed</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversation Selected</h3>
              <p className="text-gray-500">Select a support request to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}