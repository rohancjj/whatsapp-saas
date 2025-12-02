import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

import {
  Users,
  DollarSign,
  MessageCircle,
  BarChart3,
  Smartphone,
  KeyRound,
  Zap,
  Activity,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:8080/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xl text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-red-500 p-10 text-lg">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">

      {/* ========================= HEADER ========================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">Insights of WhatsAPI platform activity</p>
      </motion.div>

      {/* ========================= TOP STATS ========================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} />}
          color="from-green-500 to-emerald-600"
        />

        <StatCard
          title="Active API Keys"
          value={stats.activeAPIKeys}
          icon={<KeyRound size={24} />}
          color="from-blue-500 to-indigo-600"
        />

        <StatCard
          title="Messages Used"
          value={stats.totalMessagesUsed}
          icon={<MessageCircle size={24} />}
          color="from-amber-500 to-orange-600"
        />

        <StatCard
          title="Messages Left"
          value={stats.totalMessagesLeft}
          icon={<BarChart3 size={24} />}
          color="from-rose-500 to-red-600"
        />

      </div>

      {/* ========================= CHARTS PLACEHOLDERS ========================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* API USAGE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-slate-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} />
            API Usage Trend
          </h2>

          <div className="h-56 flex items-center justify-center text-slate-400">
            <p>[ API Usage Line Chart Coming Soon ]</p>
          </div>
        </motion.div>

        {/* MESSAGE ANALYTICS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-slate-200"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Message Analytics
          </h2>

          <div className="h-56 flex items-center justify-center text-slate-400">
            <p>[ Message Bar Chart Coming Soon ]</p>
          </div>
        </motion.div>

      </div>

      {/* ========================= SYSTEM STATUS ========================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-lg border border-slate-200 p-6 rounded-3xl shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-5">System Status</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <StatusCard
            label="Server Status"
            value={stats.system.serverStatus}
            color="text-green-600"
            icon={<Zap size={20} />}
          />

          <StatusCard
            label="Connected WhatsApp Sessions"
            value={`${stats.connectedUsers} Active`}
            color="text-blue-600"
            icon={<Smartphone size={20} />}
          />

          <StatusCard
            label="API Response Time"
            value={`${stats.system.apiLatency} ms`}
            color="text-orange-600"
            icon={<Activity size={20} />}
          />

        </div>
      </motion.div>

    </div>
  );
}

/* ========================= COMPONENTS ========================= */

const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className={`rounded-3xl p-6 shadow-lg bg-gradient-to-br ${color} text-white flex flex-col gap-3`}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
      <div className="p-2 bg-white/20 rounded-xl">{icon}</div>
    </div>
    <h2 className="text-3xl font-bold">{value}</h2>
  </motion.div>
);

const StatusCard = ({ label, value, icon, color }) => (
  <div className="p-5 bg-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow text-slate-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  </div>
);
