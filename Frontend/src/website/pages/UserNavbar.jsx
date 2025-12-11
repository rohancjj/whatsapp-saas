import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wifi, Key, CreditCard, Settings, LogOut } from 'lucide-react';
import { disconnectUserSocket } from './UserDashboard';

const UserNavbar = () => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Dashboard", path: "/user/dashboard", icon: <Home size={20} /> },
    { label: "WhatsApp Connect", path: "/user/dashboard/whatsapp", icon: <Wifi size={20} /> },
    { label: "API Key", path: "/user/dashboard/api", icon: <Key size={20} /> },
    { label: "Billing", path: "/user/dashboard/billing", icon: <CreditCard size={20} /> },
    { label: "Settings", path: "/user/dashboard/settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    // CRITICAL: Disconnect socket before clearing storage
    disconnectUserSocket();
    
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    // Redirect to auth page
    window.location.href = '/auth';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900">Current</h1>
        <p className="text-sm text-gray-500">User Panel</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserNavbar;