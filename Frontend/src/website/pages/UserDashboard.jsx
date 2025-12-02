import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  TextField,
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [tabValue, setTabValue] = useState(0);

  // *** NEW STATE FOR CHATTING ***
  const [messageToSend, setMessageToSend] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // Auto scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [chatMessages]);

  // -------------------------
  // JWT USER ID
  // -------------------------
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  };
  const userId = getUserId();

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // ----------------------------
  // Fetch API KEY
  // ----------------------------
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
    } catch (err) {
      console.error("API key fetch error", err);
      showSnackbar("Failed to fetch API key", "error");
    } finally {
      setLoadingApiKey(false);
    }
  };

  // ----------------------------
  // Regenerate API Key
  // ----------------------------
  const regenerateApiKey = async () => {
    if (
      !window.confirm(
        "⚠️ Regenerate key? All apps using current key will stop working."
      )
    )
      return;

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
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to regenerate API key", "error");
    } finally {
      setLoadingApiKey(false);
    }
  };

  // ----------------------------
  // Start WA Linking
  // ----------------------------
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
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to start linking", "error");
      setLoadingQR(false);
    }
  };

  // ============================================================
  // NEW: SEND MESSAGE FROM DASHBOARD
  // ============================================================
  const sendMessage = async () => {
    if (!recipientNumber || !messageToSend) {
      showSnackbar("Please enter number & message", "warning");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/send",
        { to: recipientNumber, text: messageToSend },
        { headers: { "x-api-key": apiKey } }
      );

      setChatMessages((prev) => [
        ...prev,
        { from: "you", text: messageToSend, timestamp: new Date() },
      ]);

      setMessageToSend("");

      showSnackbar("Message sent!", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to send message", "error");
    }
  };

  // ============================================================
  // SOCKET CONNECTION
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch Plan
    const fetchPlan = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:8080/user/active-plan",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setActivePlan(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
    fetchApiKey();

    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("Socket connected");
      if (userId) socket.emit("join", userId);
    });

    // QR
    socket.on("qr", async (qrString) => {
      const dataUrl = await QRCode.toDataURL(qrString);
      setWhatsAppQR(dataUrl);
      setWhatsAppConnected(false);
      setLoadingQR(false);
    });

    // Connected
    socket.on("whatsapp_connected", (data) => {
      setWhatsAppConnected(true);
      setWhatsAppQR(null);
      setLoadingQR(false);
      if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
      showSnackbar("WhatsApp connected!", "success");
      fetchApiKey();
    });

    socket.on("whatsapp_disconnected", () => {
      setWhatsAppConnected(false);
      setWhatsAppQR(null);
      setLoadingQR(false);
      showSnackbar("WhatsApp disconnected", "warning");
    });

    // ================================
    // 📩 NEW — RECEIVE MESSAGES
    // ================================
    socket.on("incoming_message", (msg) => {
      console.log("Incoming:", msg);

      setChatMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, [userId]);

  // ============================================================
  // UI BELOW
  // ============================================================
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 4, textAlign: "center" }}
      >
        📱 User Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* ----------- Subscription ----------- */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              height: "100%",
              color: "white",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <CardContent>
              <Typography variant="h6">💳 Subscription</Typography>
              {loadingPlan ? (
                <CircularProgress sx={{ color: "white" }} />
              ) : activePlan ? (
                <Box>
                  <Typography variant="h6">{activePlan.name}</Typography>
                  <Typography>
                    💬 {activePlan.messagesUsed}/{activePlan.totalMessages}
                  </Typography>
                  <Typography>
                    📅 {new Date(activePlan.expiryAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                "No active plan"
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ----------- WhatsApp Status ----------- */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              height: "100%",
              color: "white",
              background: whatsAppConnected
                ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)"
                : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            <CardContent>
              <Typography variant="h6">📱 WhatsApp</Typography>
              {whatsAppConnected ? (
                <>
                  <Typography variant="h6">Connected</Typography>
                  {phoneNumber && <Typography>+{phoneNumber}</Typography>}
                </>
              ) : (
                "Not Connected"
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ----------- API Key Status ----------- */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              height: "100%",
              color: "white",
              background:
                "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            }}
          >
            <CardContent>
              <Typography variant="h6">🔑 API Key</Typography>
              {apiKey ? (
                <Typography>{apiKey.substring(0, 20)}...</Typography>
              ) : (
                "Not Generated"
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ----------- Send Message + Incoming Messages ----------- */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                💬 WhatsApp Messaging
              </Typography>

              {!whatsAppConnected ? (
                <Alert severity="warning">
                  Connect WhatsApp to start messaging.
                </Alert>
              ) : (
                <>
                  {/* SEND MESSAGE */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <TextField
                      label="Phone Number (with country code)"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Message"
                      value={messageToSend}
                      onChange={(e) => setMessageToSend(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={sendMessage}
                      sx={{ height: 55 }}
                    >
                      Send
                    </Button>
                  </Box>

                  {/* CHAT BOX */}
                  <Box
                    sx={{
                      height: 300,
                      overflowY: "auto",
                      borderRadius: 2,
                      border: "1px solid #ddd",
                      p: 2,
                      background: "#fafafa",
                    }}
                  >
                    {chatMessages.map((msg, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent:
                            msg.from === "you" ? "flex-end" : "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            maxWidth: "60%",
                            background:
                              msg.from === "you" ? "#d1f7c4" : "#e0e0e0",
                          }}
                        >
                          <Typography variant="body2">{msg.text}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "gray" }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ----------- WhatsApp QR Card ----------- */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, textAlign: "center" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {whatsAppConnected
                  ? "✅ WhatsApp Connected"
                  : "🔗 Connect WhatsApp"}
              </Typography>

              {!whatsAppConnected && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    mb: 2,
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                  }}
                  onClick={startWhatsAppLink}
                  disabled={!activePlan || loadingQR}
                >
                  {loadingQR ? "Generating QR..." : "Connect WhatsApp"}
                </Button>
              )}

              {/* QR / CONNECT STATUS */}
              {loadingQR ? (
                <CircularProgress />
              ) : whatsAppConnected ? (
                <Typography sx={{ mt: 2 }}>Connected</Typography>
              ) : whatsAppQR ? (
                <>
                  <Typography sx={{ mb: 2 }}>
                    Scan QR in WhatsApp → Linked Devices
                  </Typography>
                  <img
                    src={whatsAppQR}
                    alt="qr"
                    style={{ width: 260, borderRadius: 10 }}
                  />
                </>
              ) : (
                <Typography>Click "Connect WhatsApp"</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default UserDashboard;
