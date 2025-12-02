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
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import { io } from "socket.io-client";
import QRCode from "qrcode";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 20 }}>
      {value === index && children}
    </div>
  );
}

const UserDashboard = () => {
  const [whatsAppQR, setWhatsAppQR] = useState(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const [apiKey, setApiKey] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [tabValue, setTabValue] = useState(0);

  // Get userId from JWT
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  };

  const userId = getUserId();

  // Show notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar("Copied to clipboard!", "success");
  };

  // Fetch API Key
  const fetchApiKey = async () => {
    try {
      setLoadingApiKey(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:8080/api/v1/whatsapp/api-key", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApiKey(data.apiKey);
      setWhatsAppConnected(data.connected);
      setPhoneNumber(data.phoneNumber);
    } catch (err) {
      console.error("Failed to fetch API key", err);
      if (err.response?.status !== 400) {
        showSnackbar("Failed to fetch API key", "error");
      }
    } finally {
      setLoadingApiKey(false);
    }
  };

  // Regenerate API Key
  const regenerateApiKey = async () => {
    if (!window.confirm("⚠️ This will invalidate your current API key. All applications using it will stop working. Continue?")) {
      return;
    }

    try {
      setLoadingApiKey(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/regenerate-key",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApiKey(data.apiKey);
      showSnackbar("API Key regenerated successfully!", "success");
    } catch (err) {
      console.error("Failed to regenerate API key", err);
      showSnackbar("Failed to regenerate API key", "error");
    } finally {
      setLoadingApiKey(false);
    }
  };

  // Start WhatsApp Linking
  const startWhatsAppLink = async () => {
    try {
      setLoadingQR(true);
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        "http://localhost:8080/api/v1/whatsapp/link",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
      showSnackbar("Generating QR code...", "info");
    } catch (err) {
      console.error("WhatsApp link start failed", err);
      showSnackbar(err.response?.data?.message || "Failed to start linking", "error");
      setLoadingQR(false);
    }
  };

  const codeExamples = {
    javascript: `// JavaScript / Node.js
async function sendWhatsAppMessage(to, text) {
  const response = await fetch('http://localhost:8080/api/v1/whatsapp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${apiKey || 'YOUR_API_KEY'}'
    },
    body: JSON.stringify({ to, text })
  });
  return await response.json();
}

// Usage
sendWhatsAppMessage('919876543210', 'Hello!')
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));`,

    python: `# Python
import requests

def send_whatsapp_message(to, text):
    url = 'http://localhost:8080/api/v1/whatsapp/send'
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': '${apiKey || 'YOUR_API_KEY'}'
    }
    data = {'to': to, 'text': text}
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Usage
result = send_whatsapp_message('919876543210', 'Hello!')
print(result)`,

    php: `<?php
// PHP
function sendWhatsAppMessage($to, $text) {
    $url = 'http://localhost:8080/api/v1/whatsapp/send';
    $data = json_encode(['to' => $to, 'text' => $text]);
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\\r\\n" .
                       "x-api-key: ${apiKey || 'YOUR_API_KEY'}\\r\\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];
    $context = stream_context_create($options);
    return json_decode(file_get_contents($url, false, $context), true);
}

$result = sendWhatsAppMessage('919876543210', 'Hello!');
?>`,

    curl: `curl -X POST http://localhost:8080/api/v1/whatsapp/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{"to": "919876543210", "text": "Hello!"}'`
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch Active Plan
    const fetchPlan = async () => {
      try {
        const { data } = await axios.get("http://localhost:8080/user/active-plan", {
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
    fetchApiKey();

    // Socket.io Connection
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (userId) {
        socket.emit("join", userId);
      }
    });

    socket.on("qr", async (qrString) => {
      console.log("QR received for user");
      const dataUrl = await QRCode.toDataURL(qrString);
      setWhatsAppQR(dataUrl);
      setWhatsAppConnected(false);
      setLoadingQR(false);
    });

    socket.on("whatsapp_connected", (data) => {
      console.log("WhatsApp connected!");
      setWhatsAppConnected(true);
      setWhatsAppQR(null);
      setLoadingQR(false);
      if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
      showSnackbar("WhatsApp connected successfully!", "success");
      fetchApiKey();
    });

    socket.on("whatsapp_disconnected", () => {
      setWhatsAppConnected(false);
      setWhatsAppQR(null);
      setLoadingQR(false);
      showSnackbar("WhatsApp disconnected", "warning");
    });

    return () => socket.disconnect();
  }, [userId]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4, textAlign: "center" }}>
        📱 User Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Active Plan Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                💳 Subscription
              </Typography>
              {loadingPlan ? (
                <CircularProgress sx={{ color: "white" }} />
              ) : activePlan ? (
                <Box>
                  <Typography fontWeight={600} sx={{ fontSize: "1.2rem", mb: 1 }}>
                    {activePlan.name}
                  </Typography>
                  <Typography sx={{ opacity: 0.9, mb: 1 }}>
                    💬 {activePlan.messagesUsed || 0} / {activePlan.totalMessages}
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>
                    📅 {new Date(activePlan.expiryAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                <Typography>No active plan</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp Status Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: "100%", background: whatsAppConnected ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                📱 WhatsApp
              </Typography>
              {whatsAppConnected ? (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    ✅
                    <Typography fontWeight={600} sx={{ fontSize: "1.2rem" }}>
                      Connected
                    </Typography>
                  </Box>
                  {phoneNumber && (
                    <Typography sx={{ opacity: 0.9 }}>
                      +{phoneNumber}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography fontWeight={600} sx={{ fontSize: "1.2rem", mb: 1 }}>
                    Not Connected
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
                    Link WhatsApp below
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Status Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: "100%", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                🔑 API Key
              </Typography>
              {apiKey ? (
                <Box>
                  <Typography fontWeight={600} sx={{ fontSize: "1.2rem", mb: 1 }}>
                    Active
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {apiKey.substring(0, 20)}...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography fontWeight={600} sx={{ fontSize: "1.2rem", mb: 1 }}>
                    Not Generated
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
                    Activate plan first
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Key Management */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    🔑 API Key Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use this key to send WhatsApp messages from your application
                  </Typography>
                </Box>
                <Tooltip title="Regenerate API Key">
                  <IconButton onClick={regenerateApiKey} disabled={loadingApiKey || !apiKey} color="primary">
                    🔄
                  </IconButton>
                </Tooltip>
              </Box>

              <Divider sx={{ my: 2 }} />

              {loadingApiKey ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : apiKey ? (
                <Box>
                  <Box sx={{ p: 2, borderRadius: 2, background: "#f5f5f7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                    <Typography sx={{ fontFamily: "monospace", wordBreak: "break-all", flex: 1, fontSize: "0.95rem" }}>
                      {apiKey}
                    </Typography>
                    <IconButton onClick={() => copyToClipboard(apiKey)} color="primary">
                      📋
                    </IconButton>
                  </Box>

                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Keep this secure!</strong> Anyone with this key can send messages through your WhatsApp.
                  </Alert>

                  {/* Code Examples Tabs */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      Integration Examples:
                    </Typography>

                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                      <Tab label="JavaScript" />
                      <Tab label="Python" />
                      <Tab label="PHP" />
                      <Tab label="cURL" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                      <Box sx={{ position: "relative", background: "#1a202c", color: "#68d391", p: 3, borderRadius: 2, overflow: "auto" }}>
                        <IconButton sx={{ position: "absolute", top: 10, right: 10, color: "#68d391" }} onClick={() => copyToClipboard(codeExamples.javascript)}>
                          📋
                        </IconButton>
                        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          {codeExamples.javascript}
                        </pre>
                      </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                      <Box sx={{ position: "relative", background: "#1a202c", color: "#68d391", p: 3, borderRadius: 2, overflow: "auto" }}>
                        <IconButton sx={{ position: "absolute", top: 10, right: 10, color: "#68d391" }} onClick={() => copyToClipboard(codeExamples.python)}>
                          📋
                        </IconButton>
                        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          {codeExamples.python}
                        </pre>
                      </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                      <Box sx={{ position: "relative", background: "#1a202c", color: "#68d391", p: 3, borderRadius: 2, overflow: "auto" }}>
                        <IconButton sx={{ position: "absolute", top: 10, right: 10, color: "#68d391" }} onClick={() => copyToClipboard(codeExamples.php)}>
                          📋
                        </IconButton>
                        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          {codeExamples.php}
                        </pre>
                      </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={3}>
                      <Box sx={{ position: "relative", background: "#1a202c", color: "#68d391", p: 3, borderRadius: 2, overflow: "auto" }}>
                        <IconButton sx={{ position: "absolute", top: 10, right: 10, color: "#68d391" }} onClick={() => copyToClipboard(codeExamples.curl)}>
                          📋
                        </IconButton>
                        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          {codeExamples.curl}
                        </pre>
                      </Box>
                    </TabPanel>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  Please activate a plan to get your API key
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp Connection */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, textAlign: "center" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                {whatsAppConnected ? "✅ WhatsApp Connected" : "🔗 Connect WhatsApp"}
              </Typography>

              {!whatsAppConnected && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2, mb: 2, px: 4, py: 1.5, borderRadius: 3,
                    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    fontSize: "1rem", fontWeight: 600,
                    "&:hover": { background: "linear-gradient(135deg, #128C7E 0%, #075E54 100%)" }
                  }}
                  onClick={startWhatsAppLink}
                  disabled={!activePlan || loadingQR}
                >
                  {loadingQR ? "Generating QR..." : "Connect WhatsApp"}
                </Button>
              )}

              {loadingQR ? (
                <Box sx={{ py: 3 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Generating QR code...</Typography>
                </Box>
              ) : whatsAppConnected ? (
                <Box sx={{ py: 3 }}>
                  <Box sx={{ fontSize: 60, mb: 2 }}>✅</Box>
                  <Typography variant="h6" color="success.main" fontWeight={600}>
                    WhatsApp Connected!
                  </Typography>
                  {phoneNumber && (
                    <Typography sx={{ mt: 1 }}>Number: +{phoneNumber}</Typography>
                  )}
                </Box>
              ) : whatsAppQR ? (
                <Box sx={{ py: 2 }}>
                  <Typography sx={{ mb: 2, color: "text.secondary" }}>
                    Open WhatsApp → Settings → Linked Devices → Link a Device
                  </Typography>
                  <img src={whatsAppQR} alt="QR" style={{ width: 280, height: 280, borderRadius: 20, boxShadow: "0px 6px 25px rgba(0,0,0,0.15)" }} />
                </Box>
              ) : (
                !whatsAppConnected && (
                  <Typography sx={{ mt: 2, color: "text.secondary" }}>
                    {activePlan ? "Click the button above to start" : "Activate a plan first"}
                  </Typography>
                )
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserDashboard;