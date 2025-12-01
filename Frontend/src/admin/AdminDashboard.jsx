import React from "react";
import { BarChart3, Users, Settings, DollarSign, CheckSquare, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800 text-white">

      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 p-6 flex flex-col shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          WhatsAPI Admin
        </h1>

        <div className="mt-10 flex flex-col gap-3 text-slate-300">
          <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active />
          <NavItem icon={<Users size={20} />} label="Users" />
          <NavItem icon={<DollarSign size={20} />} label="Pricing Plans" />
          <NavItem icon={<CheckSquare size={20} />} label="API Keys" />
          <NavItem icon={<MessageSquare size={20} />} label="Support Tickets" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        <h2 className="text-4xl font-bold mb-8 tracking-tight">Dashboard Overview</h2>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          <StatCard title="Total Users" value="1,204" change="+8%" />
          <StatCard title="Paid Users" value="423" change="+12%" />
          <StatCard title="Monthly Revenue" value="₹82,700" change="+15%" />
        </div>

        {/* CHART AREA */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
          <h3 className="text-2xl font-semibold mb-4">API Usage Trend</h3>

          <div className="h-60 flex items-center justify-center text-slate-500">
            {/* Placeholder for chart */}
            <p className="text-slate-500">[ Chart Component Goes Here ]</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* COMPONENTS */

const NavItem = ({ icon, label, active }) => (
  <button
    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all 
      ${active ? "bg-slate-800 text-white shadow-lg" : "hover:bg-slate-800/50"}`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, change }) => (
  <div className="bg-slate-900/40 border border-slate-700 p-6 rounded-3xl backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all">
    <p className="text-slate-400 text-sm">{title}</p>
    <h3 className="text-3xl font-bold mt-2">{value}</h3>
    <p className="text-emerald-400 text-sm mt-1">{change}</p>
  </div>
);
