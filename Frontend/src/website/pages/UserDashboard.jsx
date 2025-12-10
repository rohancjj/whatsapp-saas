import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Card,
  Button,
  CircularProgress,
  Grid,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Paper,
  Dialog, // Added Dialog for the warning pop-up
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import { io } from "socket.io-client";
import QRCode from "qrcode";

// ----------------------------
// Tab Panel
// ----------------------------
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 20 }}>
      {value === index && children}
    </div>
  );
}

// ----------------------------
// MAIN COMPONENT
// ----------------------------
const UserDashboard = () => {
  const [whatsAppQR, setWhatsAppQR] = useState(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const [apiKey, setApiKey] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  // New state for the disconnect warning dialog
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false); 

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [tabValue, setTabValue] = useState(0);

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  };
  const userId = getUserId();

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

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
    } catch {
      showSnackbar("Failed to fetch API key", "error");
    } finally {
      setLoadingApiKey(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!window.confirm("⚠️ Regenerate key? All apps using current key will stop working.")) return;

    try {
      setLoadingApiKey(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/regenerate-key",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApiKey(data.apiKey);
      showSnackbar("API Key regenerated!", "success");
    } catch {
      showSnackbar("Failed to regenerate API key", "error");
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
      showSnackbar("Generating QR...", "info");
    } catch {
      setLoadingQR(false);
      showSnackbar("Failed to start linking", "error");
    }
  };

  // Function called when 'Disconnect' button is initially clicked
  const handleOpenDisconnectWarning = () => {
    setShowDisconnectWarning(true);
  };
  
  // 🔴 Disconnect function (now called from the warning dialog)
  const handleDisconnect = async () => {
    setShowDisconnectWarning(false); // Close the dialog immediately

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

      showSnackbar("WhatsApp disconnected successfully", "warning");
    } catch {
      showSnackbar("Failed to disconnect", "error");
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
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
    fetchApiKey();

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
      showSnackbar("WhatsApp connected!", "success");
    });

    return () => socket.disconnect();
  }, [userId]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* HEADER */}
      <Typography variant="h4" fontWeight={700} sx={{ textAlign: "center", mb: 3 }}>
        User Dashboard
      </Typography>

      {/* TABS */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #eaeaea", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          centered
          TabIndicatorProps={{ style: { background: "black", height: 3 } }}
        >
          <Tab label="Overview" />
          <Tab label="API Key" />
          <Tab label="Connect WhatsApp" />
        </Tabs>
      </Paper>

      {/* ---------- OVERVIEW ---------- */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Subscription */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: "0px 4px 15px rgba(0,0,0,0.04)" }}>
              <Typography variant="subtitle1" fontWeight={600}>Subscription</Typography>
              {loadingPlan ? <CircularProgress size={22} sx={{ mt: 2 }} /> : activePlan ? (
                <Box sx={{ mt: 2 }}>
                  <Typography fontWeight={600}>{activePlan.name}</Typography>
                  <Typography>{activePlan.messagesUsed}/{activePlan.totalMessages} Messages</Typography>
                  <Typography>Expires {new Date(activePlan.expiryAt).toLocaleDateString()}</Typography>
                </Box>
              ) : <Typography>No active plan</Typography>}
            </Card>
          </Grid>

          {/* WhatsApp Status */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: "0px 4px 15px rgba(0,0,0,0.04)" }}>
              <Typography variant="subtitle1" fontWeight={600}>WhatsApp Status</Typography>
              <Typography sx={{ mt: 2 }}>
                {whatsAppConnected ? `Connected ✓ (${phoneNumber})` : "Not Connected"}
              </Typography>

              {whatsAppConnected && (
                <Button 
                  variant="contained" 
                  color="error" 
                  sx={{ mt: 2 }} 
                  onClick={handleOpenDisconnectWarning} // Now opens the warning dialog
                >
                  Disconnect
                </Button>
              )}
            </Card>
          </Grid>

          {/* API Key */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: "0px 4px 15px rgba(0,0,0,0.04)" }}>
              <Typography variant="subtitle1" fontWeight={600}>API Key</Typography>
              <Typography sx={{ mt: 2 }}>{apiKey ? apiKey.slice(0, 20) + "..." : "Not Generated"}</Typography>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ---------- API KEY ---------- */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6">API Key</Typography>

          <Box sx={{ mt: 2, p: 2, borderRadius: 3, border: "1px solid #dcdcdc", display: "flex", gap: 1 }}>
            <Typography sx={{ flex: 1 }}>{apiKey || "No API Key Found"}</Typography>
            {apiKey && (
              <Tooltip title="Copy">
                <IconButton onClick={() => navigator.clipboard.writeText(apiKey)}>📋</IconButton>
              </Tooltip>
            )}
          </Box>

          <Button sx={{ mt: 2, borderRadius: 3 }} variant="outlined" onClick={regenerateApiKey}>
            Regenerate Key
          </Button>
        </Card>
      </TabPanel>

      {/* ---------- CONNECT WHATSAPP ---------- */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ p: 3, borderRadius: 4, textAlign: "center" }}>
          <Typography variant="h6">
            {whatsAppConnected ? "WhatsApp Connected ✓" : "Connect WhatsApp"}
          </Typography>

          {!whatsAppConnected && (
            <Button variant="contained" sx={{ mt: 3, borderRadius: 3 }} onClick={startWhatsAppLink} disabled={loadingQR}>
              {loadingQR ? "Generating QR..." : "Connect"}
            </Button>
          )}

          {loadingQR && <CircularProgress sx={{ mt: 3 }} />}

          {whatsAppQR && !whatsAppConnected && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ mb: 1 }}>Scan this QR from WhatsApp → Linked Devices</Typography>
              <img src={whatsAppQR} width={220} style={{ borderRadius: 10 }} alt="QR Code" />
            </Box>
          )}
        </Card>
      </TabPanel>
      
      {/* 🛑 DISCONNECT WARNING DIALOG (New Card/Pop-up) */}
      <Dialog
        open={showDisconnectWarning}
        onClose={() => setShowDisconnectWarning(false)}
        aria-labelledby="disconnect-dialog-title"
        aria-describedby="disconnect-dialog-description"
        PaperProps={{
            sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogTitle id="disconnect-dialog-title" sx={{ color: 'red', fontWeight: 700 }}>
            ⚠️ Confirm Disconnect
        </DialogTitle>
        <DialogContent dividers>
            <Typography id="disconnect-dialog-description">
                Are you absolutely sure you want to disconnect your WhatsApp account?
            </Typography>
            <Typography sx={{ mt: 2, color: 'red', fontWeight: 600 }}>
                This will immediately stop all automated messaging and API functionality.
            </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisconnectWarning(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDisconnect} color="error" variant="contained" autoFocus>
            Disconnect Now
          </Button>
        </DialogActions>
      </Dialog>
      {/* ---------------------------------------------------- */}

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default UserDashboard;