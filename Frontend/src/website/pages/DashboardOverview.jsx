import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Calendar, CheckCircle, XCircle, Phone, Key, Wifi, CreditCard, ArrowUpCircle } from 'lucide-react';

const DashboardOverview = ({ activePlan, whatsAppConnected, phoneNumber, apiKey }) => {
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!activePlan?.expiryAt) return null;
    const expiry = new Date(activePlan.expiryAt);
    const today = new Date();
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your account summary</p>
        </div>
        <Link 
          to="/user/pricing"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
        >
          <ArrowUpCircle size={20} />
          Upgrade Plan
        </Link>
      </div>

      {/* Expiry Warning Banner */}
      {isExpiringSoon && daysRemaining > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Your plan expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                <Link to="/user/pricing" className="underline font-semibold">Renew now</Link> to continue using all features
              </p>
            </div>
          </div>
        </div>
      )}

      {daysRemaining !== null && daysRemaining <= 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                Your plan has expired
              </p>
              <p className="text-sm text-red-700 mt-1">
                <Link to="/user/pricing" className="underline font-semibold">Choose a plan</Link> to continue using the service
              </p>
            </div>
          </div>
        </div>
      )}

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
          <Link to="/user/pricing" className="p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-center">
            <ArrowUpCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="font-medium text-gray-900">Upgrade Plan</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;