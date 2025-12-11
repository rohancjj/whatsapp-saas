import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';

import UserNavbar from './UserNavbar';
import DashboardOverview from './DashboardOverview';
import WhatsAppConnect from './WhatsAppConnect';
import APIKeyPage from './APIKeyPage';

const getUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch {
    return null;
  }
};

const UserDashboard = () => {
  const [activePlan, setActivePlan] = useState(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [whatsAppQR, setWhatsAppQR] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  const userId = getUserId();

  const fetchApiKey = async () => {
    try {
      setLoadingApiKey(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/whatsapp/api-key",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApiKey(data.apiKey);
      setWhatsAppConnected(data.connected);
      setPhoneNumber(data.phoneNumber);
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    } finally {
      setLoadingApiKey(false);
    }
  };

  const regenerateApiKey = async () => {
    try {
      setLoadingApiKey(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/regenerate-key",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApiKey(data.apiKey);
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    } finally {
      setLoadingApiKey(false);
    }
  };

  const startWhatsAppLink = async () => {
    try {
      setLoadingQR(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/link",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.apiKey) setApiKey(data.apiKey);
    } catch (error) {
      console.error('Failed to start linking:', error);
      setLoadingQR(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8080/api/v1/whatsapp/disconnect",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWhatsAppConnected(false);
      setWhatsAppQR(null);
      setPhoneNumber(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchPlan = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:8080/user/active-plan",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setActivePlan(data);
      } catch (error) {
        console.error('Failed to fetch plan:', error);
      }
    };

    fetchPlan();
    fetchApiKey();

    // Socket.io setup
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      if (userId) socket.emit("join", userId);
    });

    socket.on("qr", async (qrString) => {
      setWhatsAppQR(await QRCode.toDataURL(qrString));
      setWhatsAppConnected(false);
      setLoadingQR(false);
    });

    socket.on("whatsapp_connected", (data) => {
      setWhatsAppQR(null);
      setWhatsAppConnected(true);
      if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
      fetchApiKey();
    });

    return () => socket.disconnect();
  }, [userId]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserNavbar />
      
      <div className="ml-64 flex-1 p-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardOverview 
                activePlan={activePlan}
                whatsAppConnected={whatsAppConnected}
                phoneNumber={phoneNumber}
                apiKey={apiKey}
              />
            } 
          />
          <Route 
            path="/whatsapp" 
            element={
              <WhatsAppConnect 
                whatsAppConnected={whatsAppConnected}
                phoneNumber={phoneNumber}
                whatsAppQR={whatsAppQR}
                loadingQR={loadingQR}
                startWhatsAppLink={startWhatsAppLink}
                handleDisconnect={handleDisconnect}
              />
            } 
          />
          <Route 
            path="/api" 
            element={
              <APIKeyPage 
                apiKey={apiKey}
                loadingApiKey={loadingApiKey}
                regenerateApiKey={regenerateApiKey}
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default UserDashboard;