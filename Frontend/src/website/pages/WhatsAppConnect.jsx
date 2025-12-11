import React, { useState } from 'react';
import { CheckCircle, Wifi, Phone, AlertCircle } from 'lucide-react';

const WhatsAppConnect = ({ 
  whatsAppConnected, 
  phoneNumber, 
  whatsAppQR, 
  loadingQR, 
  startWhatsAppLink,
  handleDisconnect 
}) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Connection</h1>
        <p className="text-gray-600 mt-1">Connect your WhatsApp account to start sending messages</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {whatsAppConnected ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected Successfully!</h2>
            <p className="text-gray-600 mb-6">Your WhatsApp is connected and ready to use</p>
            
            {phoneNumber && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-gray-600">Connected Number</p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center mt-1">
                  <Phone size={20} />
                  {phoneNumber}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowDisconnectModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
            >
              Disconnect WhatsApp
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your WhatsApp</h2>
            <p className="text-gray-600 mb-6">Scan the QR code with your WhatsApp to connect</p>

            {!whatsAppQR && !loadingQR && (
              <button
                onClick={startWhatsAppLink}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Generate QR Code
              </button>
            )}

            {loadingQR && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                <p className="text-gray-600">Generating QR Code...</p>
              </div>
            )}

            {whatsAppQR && !whatsAppConnected && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>
                <img 
                  src={whatsAppQR} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-xl"
                />
                <p className="text-sm text-gray-500 mt-4">QR Code expires in 60 seconds</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disconnect Warning Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Disconnect WhatsApp?
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              This will immediately stop all automated messaging and API functionality.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDisconnect();
                  setShowDisconnectModal(false);
                }}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnect;