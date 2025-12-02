import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  Box,
} from "@mui/material";
import axios from "axios";
import { io } from "socket.io-client";
import QRCode from "qrcode";

const UserDashboard = () => {
  const [whatsAppQR, setWhatsAppQR] = useState(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Get userId from JWT
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  };

  const userId = getUserId();

  // CTA Button → Start WhatsApp Linking
  const startWhatsAppLink = async () => {
    try {
      setLoadingQR(true);
      const token = localStorage.getItem("token");

      await axios.post("http://localhost:8080/api/v1/whatsapp/link", {}, {
  headers: { Authorization: `Bearer ${token}` }
});

    } catch (err) {
      console.error("WhatsApp link start failed", err);
      setLoadingQR(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch Active Plan
    const fetchPlan = async () => {
      try {
        const { data } = await axios.get("/user/active-plan", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setActivePlan(data);
      } catch (err) {
        console.error("Failed to fetch plan", err);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();

    // Socket.io Connection
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      // Join the user's room
      if (userId) {
        socket.emit("join", userId);
      }
    });

    // Receive QR Code
    socket.on("qr", async (qrString) => {
      console.log("QR received for user");
      const dataUrl = await QRCode.toDataURL(qrString);
      setWhatsAppQR(dataUrl);
      setWhatsAppConnected(false);
      setLoadingQR(false);
    });

    // On success connection
    socket.on("whatsapp_connected", () => {
      console.log("WhatsApp connected!");
      setWhatsAppConnected(true);
      setWhatsAppQR(null);
      setLoadingQR(false);
    });

    socket.on("whatsapp_disconnected", () => {
      setWhatsAppConnected(false);
      setWhatsAppQR(null);
      setLoadingQR(false);
    });

    return () => socket.disconnect();
  }, [userId]);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 4, textAlign: "center" }}
      >
        User Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* Active Plan */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, backdropFilter: "blur(10px)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600}>
                Active Subscription
              </Typography>

              {loadingPlan ? (
                <CircularProgress sx={{ mt: 2 }} />
              ) : activePlan ? (
                <Box sx={{ mt: 2 }}>
                  <Typography fontWeight={600}>Plan: {activePlan.name}</Typography>
                  <Typography>
                    Expires: {new Date(activePlan.expiryAt).toLocaleDateString()}
                  </Typography>

                  {/* API Key */}
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 3,
                      background: "#f5f5f7",
                      wordBreak: "break-all",
                    }}
                  >
                    <Typography fontWeight={600}>API Key:</Typography>
                    <Typography>{activePlan.apiKey}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography>No active plan</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp Section */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, textAlign: "center" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600}>
                WhatsApp Connection
              </Typography>

              {!whatsAppConnected && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    px: 4,
                    py: 1.2,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #00b06b 0%, #00994f 100%)",
                  }}
                  onClick={startWhatsAppLink}
                >
                  Connect WhatsApp
                </Button>
              )}

              {loadingQR ? (
                <CircularProgress sx={{ mt: 3 }} />
              ) : whatsAppConnected ? (
                <Typography
                  variant="h5"
                  color="green"
                  fontWeight={700}
                  sx={{ mt: 3 }}
                >
                  ✅ Connected Successfully
                </Typography>
              ) : whatsAppQR ? (
                <>
                  <Typography sx={{ mt: 2, mb: 2 }}>
                    Scan from WhatsApp → Linked Devices
                  </Typography>
                  <img
                    src={whatsAppQR}
                    alt="QR"
                    style={{
                      width: 240,
                      borderRadius: 20,
                      boxShadow: "0px 6px 25px rgba(0,0,0,0.2)",
                    }}
                  />
                </>
              ) : (
                <Typography sx={{ mt: 2 }}>Click connect to continue</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
