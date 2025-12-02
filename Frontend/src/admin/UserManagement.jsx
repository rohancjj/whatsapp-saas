import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search,
  UserCircle,
  KeyRound,
  Smartphone,
  Wifi,
  WifiOff,
  Mail,
  Package,
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8080/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ FIXED (your backend returns an array)
      setUsers(res.data || []);
      setFiltered(res.data || []);
      setLoading(false);

    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fadeIn">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold text-slate-800">User Management</h1>

        {/* Search */}
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
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="pb-3">User</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Plan</th>
              <th className="pb-3">API Key</th>
              <th className="pb-3">WhatsApp</th>
              <th className="pb-3">Messages</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b last:border-none hover:bg-slate-50 transition"
              >
                {/* User info */}
                <td className="py-4 flex items-center gap-3">
                  <UserCircle size={32} className="text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-sm text-slate-500">{user.phone || "—"}</p>
                  </div>
                </td>

                {/* Email */}
                <td>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Mail size={16} /> {user.email}
                  </div>
                </td>

                {/* Plan */}
                <td>
                  {user.activePlan ? (
                    <div>
                      <p className="font-semibold">
                        {user.activePlan.planId || "No Plan Name"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Used {user.activePlan.messagesUsed}/{user.activePlan.totalMessages}
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-400">No Plan</span>
                  )}
                </td>

                {/* API Key */}
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

                {/* WhatsApp Status */}
                <td>
                  {user.whatsapp?.connected ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Wifi size={18} /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <WifiOff size={18} /> Offline
                    </span>
                  )}

                  <p className="text-xs text-slate-500">
                    {user.whatsapp?.phone || "No Number"}
                  </p>
                </td>

                {/* Messages */}
                <td>
                  <div className="text-slate-800">
                    {user.activePlan?.messagesUsed || 0}
                  </div>
                </td>

              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
