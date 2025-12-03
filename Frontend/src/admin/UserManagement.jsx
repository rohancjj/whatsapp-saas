import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserCircle,
  KeyRound,
  Wifi,
  WifiOff,
  Mail,
  RefreshCw,
} from "lucide-react";

/* =======================================================
   PREMIUM APPLE-STYLE CONFIRM MODAL
======================================================= */
const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm"
      >
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* =======================================================
   MAIN ADMIN USER MANAGEMENT PAGE
======================================================= */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDropdown, setOpenDropdown] = useState(null);

  const [modalData, setModalData] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const token = localStorage.getItem("token");

  /* ================================
      FETCH USERS
  ================================== */
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8080/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data || []);
      setFiltered(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  /* ================================
      SEARCH FILTER
  ================================== */
  const handleSearch = (value) => {
    setSearch(value);

    const s = value.toLowerCase();
    const f = users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
    );

    setFiltered(f);
  };

  /* ================================
      PERFORM ACTIONS
  ================================== */
  const performAction = async (userId, action, method = "POST") => {
    const endpoints = {
      suspend: `/admin/suspend/${userId}`,
      unsuspend: `/admin/unsuspend/${userId}`,
      disconnect: `/admin/disconnect/${userId}`,
      terminate: `/admin/terminate/${userId}`,
      resume: `/admin/resume/${userId}`,
      delete: `/admin/user/${userId}`,
    };

    try {
      const url = `http://localhost:8080${endpoints[action]}`;

      if (method === "DELETE") {
        await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      }

      setModalData({ ...modalData, open: false });
      await fetchUsers();
    } catch (err) {
      console.error("Action Error:", err);
    }
  };

  /* ================================
      LOADING UI
  ================================== */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  /* =======================================================
        MAIN UI
  ======================================================= */
  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">User Management</h1>

        <div className="relative">
          <Search className="absolute top-2 left-3 text-slate-400" size={18} />

          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="pb-3">User</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Plan</th>
              <th className="pb-3">API Key</th>
              <th className="pb-3">WhatsApp</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-none hover:bg-slate-50 transition"
              >
                {/* USER */}
                <td className="py-4 flex items-center gap-3">
                  <UserCircle size={32} className="text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-sm text-slate-500">{user.phone}</p>

                    {user.suspended && (
                      <span className="text-red-500 text-xs">(Suspended)</span>
                    )}

                    {user.terminated && (
                      <span className="text-orange-600 text-xs">(Terminated)</span>
                    )}
                  </div>
                </td>

                {/* EMAIL */}
                <td>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Mail size={16} /> {user.email}
                  </div>
                </td>

                {/* PLAN */}
                <td>
                  {user.activePlan ? (
                    <>
                      <p className="font-semibold">
                        {user.activePlan.planId || "No Plan"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Used {user.activePlan.messagesUsed}/
                        {user.activePlan.totalMessages}
                      </p>
                    </>
                  ) : (
                    <span className="text-slate-400">No Plan</span>
                  )}
                </td>

                {/* API KEY */}
                <td>
                  {user.activePlan?.apiKey ? (
                    <div className="flex items-center gap-1 text-slate-800">
                      <KeyRound size={16} />
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                        {user.activePlan.apiKey.substring(0, 12)}...
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">No API Key</span>
                  )}
                </td>

                {/* WHATSAPP */}
                <td>
                  {user.whatsapp?.connected ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <Wifi size={18} /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <WifiOff size={18} /> Offline
                    </span>
                  )}

                  <p className="text-xs text-slate-500">
                    {user.whatsapp?.phone || "—"}
                  </p>
                </td>

                {/* ACTIONS */}
                <td className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === user.id ? null : user.id)
                    }
                    className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs"
                  >
                    ⋯ Actions
                  </button>

                  <AnimatePresence>
                    {openDropdown === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 mt-2 w-40 bg-white shadow-xl rounded-xl border p-2 z-40"
                      >
                        {/* SUSPEND */}
                        {!user.suspended && !user.terminated && (
                          <button
                            onClick={() => {
                              setModalData({
                                open: true,
                                title: "Suspend User",
                                message:
                                  "Are you sure you want to suspend this user?",
                                onConfirm: () => performAction(user.id, "suspend"),
                              });
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100"
                          >
                            Suspend
                          </button>
                        )}

                        {/* UNSUSPEND */}
                        {user.suspended && !user.terminated && (
                          <button
                            onClick={() => {
                              setModalData({
                                open: true,
                                title: "Unban User",
                                message: "Restore user access?",
                                onConfirm: () => performAction(user.id, "unsuspend"),
                              });
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100"
                          >
                            Unban
                          </button>
                        )}

                        {/* DISCONNECT */}
                        {!user.terminated && (
                          <button
                            onClick={() => {
                              setModalData({
                                open: true,
                                title: "Disconnect WhatsApp",
                                message: "Force logout from WhatsApp session?",
                                onConfirm: () => performAction(user.id, "disconnect"),
                              });
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100"
                          >
                            Disconnect
                          </button>
                        )}

                        {/* TERMINATE */}
                        {!user.terminated && (
                          <button
                            onClick={() => {
                              setModalData({
                                open: true,
                                title: "Terminate User",
                                message:
                                  "This will revoke plan, API key and disconnect WhatsApp. Continue?",
                                onConfirm: () => performAction(user.id, "terminate"),
                              });
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-orange-600 hover:bg-orange-50"
                          >
                            Terminate
                          </button>
                        )}

                        {/* RESUME */}
                        {user.terminated && (
                          <button
                            onClick={() => {
                              setModalData({
                                open: true,
                                title: "Resume User",
                                message:
                                  "Restore user’s account and allow access again?",
                                onConfirm: () => performAction(user.id, "resume"),
                              });
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-green-600 hover:bg-green-50"
                          >
                            Resume User
                          </button>
                        )}

                        {/* DELETE */}
                        <button
                          onClick={() => {
                            setModalData({
                              open: true,
                              title: "Delete User",
                              message:
                                "This action is permanent and cannot be undone.",
                              onConfirm: () =>
                                performAction(user.id, "delete", "DELETE"),
                            });
                            setOpenDropdown(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GLOBAL CONFIRM MODAL */}
      <ConfirmModal
        open={modalData.open}
        title={modalData.title}
        message={modalData.message}
        onConfirm={() => {
          modalData.onConfirm();
          setModalData({ ...modalData, open: false });
        }}
        onCancel={() => setModalData({ ...modalData, open: false })}
      />
    </div>
  );
}
