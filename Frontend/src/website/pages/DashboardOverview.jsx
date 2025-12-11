import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Calendar, CheckCircle, XCircle, Phone, Key, Wifi, CreditCard, Settings as SettingsIcon } from 'lucide-react';

const DashboardOverview = ({ activePlan, whatsAppConnected, phoneNumber, apiKey }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your account summary</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Subscription Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Subscription</h3>
          </div>
          {activePlan ? (
            <div>
              <p className="text-2xl font-bold mb-2">{activePlan.name}</p>
              <p className="text-blue-100 text-sm">
                {activePlan.messagesUsed} / {activePlan.totalMessages} messages used
              </p>
              <div className="mt-4 pt-4 border-t border-blue-400">
                <p className="text-sm text-blue-100 flex items-center gap-2">
                  <Calendar size={16} />
                  Expires: {new Date(activePlan.expiryAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-blue-100">No active plan</p>
          )}
        </div>

        {/* WhatsApp Status Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-8 h-8" />
            <h3 className="text-lg font-semibold">WhatsApp</h3>
          </div>
          <div>
            {whatsAppConnected ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6" />
                  <p className="text-xl font-bold">Connected</p>
                </div>
                {phoneNumber && (
                  <p className="text-green-100 text-sm flex items-center gap-2">
                    <Phone size={16} />
                    {phoneNumber}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-6 h-6" />
                  <p className="text-xl font-bold">Not Connected</p>
                </div>
                <Link 
                  to="/user/dashboard/whatsapp"
                  className="inline-block mt-3 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition"
                >
                  Connect Now
                </Link>
              </>
            )}
          </div>
        </div>

        {/* API Key Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-8 h-8" />
            <h3 className="text-lg font-semibold">API Key</h3>
          </div>
          <div>
            {apiKey ? (
              <>
                <p className="text-sm font-mono bg-purple-700 p-3 rounded-lg mb-3 truncate">
                  {apiKey.slice(0, 20)}...
                </p>
                <Link 
                  to="/user/dashboard/api"
                  className="inline-block bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition text-sm"
                >
                  View Full Key
                </Link>
              </>
            ) : (
              <p className="text-purple-100">No API key generated</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link to="/user/dashboard/api" className="p-4 border border-gray-200 rounded-xl hover:border-black transition text-center">
            <Key className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">Manage API</p>
          </Link>
          <Link to="/user/dashboard/whatsapp" className="p-4 border border-gray-200 rounded-xl hover:border-black transition text-center">
            <Wifi className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">Connect WhatsApp</p>
          </Link>
          <Link to="/user/dashboard/billing" className="p-4 border border-gray-200 rounded-xl hover:border-black transition text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">View Billing</p>
          </Link>
          <Link to="/user/pricing" className="p-4 border border-gray-200 rounded-xl hover:border-black transition text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">Upgrade Plan</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;