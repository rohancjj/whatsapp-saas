import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, Copy, RefreshCw, AlertCircle, Wifi } from 'lucide-react';

const APIKeyPage = ({ apiKey, loadingApiKey, regenerateApiKey }) => {
  const [copied, setCopied] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Key Management</h1>
        <p className="text-gray-600 mt-1">Manage your API key for WhatsApp integration</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your API Key</h2>
            <p className="text-sm text-gray-600">Use this key to authenticate API requests</p>
          </div>
        </div>

        {apiKey ? (
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {apiKey}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <Copy size={16} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Keep your API key secure</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Never share your API key publicly. Anyone with this key can send messages through your account.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRegenerateModal(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <RefreshCw size={16} />
              Regenerate API Key
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No API key found. Connect your WhatsApp to generate one.</p>
            <Link
              to="/user/dashboard/whatsapp"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <Wifi size={18} />
              Connect WhatsApp
            </Link>
          </div>
        )}
      </div>

      {/* Regenerate Warning Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Regenerate API Key?
            </h2>
            
            <p className="text-gray-600 text-center mb-2">
              This will invalidate your current API key.
            </p>
            <p className="text-red-600 font-semibold text-center mb-6">
              All applications using the old key will stop working immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  regenerateApiKey();
                  setShowRegenerateModal(false);
                }}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIKeyPage;