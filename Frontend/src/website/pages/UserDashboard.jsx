import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Stack, CircularProgress, Grid } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';

const UserDashboard = () => {
  const [leadStats, setLeadStats] = useState(null);
  const [scheduledStats, setScheduledStats] = useState(null);
  const [whatsAppQR, setWhatsAppQR] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQR, setLoadingQR] = useState(true);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Fetch stats
    const fetchStats = async () => {
      try {
        const [leadResponse, scheduledResponse] = await Promise.all([
          axios.get('/api/v1/leads/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/schedule/stats', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setLeadStats(leadResponse.data.totalLeads);
        setScheduledStats(scheduledResponse.data.scheduledCount);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else console.error('Failed to fetch stats', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();

    // Socket.IO for WhatsApp
    const socket = io('http://localhost:8080');

    socket.on('connect', () => console.log('Connected to Socket.IO'));

    // Listen for QR updates
    socket.on('qr', async (qrBase64) => {
      try {
        // Generate a proper data URL using qrcode
        const dataUrl = await QRCode.toDataURL(qrBase64);
        setWhatsAppQR(dataUrl);
        setLoadingQR(false);
        setWhatsAppConnected(false);
      } catch (err) {
        console.error('Failed to generate QR code image', err);
      }
    });

    // Listen for WhatsApp connection status
    socket.on('whatsapp_connected', () => {
      setWhatsAppQR(null);
      setLoadingQR(false);
      setWhatsAppConnected(true);
    });

    // Optional: listen for incoming messages
    socket.on('newMessage', (msg) => {
      console.log('New WhatsApp message:', msg);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Total Leads */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Leads
              </Typography>
              {loadingStats ? <CircularProgress /> : <Typography variant="h4">{leadStats}</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Messages */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Scheduled Messages
              </Typography>
              {loadingStats ? <CircularProgress /> : <Typography variant="h4">{scheduledStats}</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* WhatsApp Connection */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                WhatsApp Connection
              </Typography>
              {loadingQR ? (
                <CircularProgress />
              ) : whatsAppConnected ? (
                <Typography color="success.main" sx={{ mt: 1 }}>
                  ✅ WhatsApp Connected
                </Typography>
              ) : whatsAppQR ? (
                <img src={whatsAppQR} alt="WhatsApp QR" style={{ width: 200, marginTop: 10 }} />
              ) : (
                <Typography color="error" sx={{ mt: 1 }}>
                  QR not available. Ensure WhatsApp session is active.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Navigation */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Navigation
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Button component={Link} to="/admin/leads" variant="contained">
                  Manage Leads
                </Button>
                <Button component={Link} to="/admin/templates" variant="contained">
                  Manage Templates
                </Button>
                <Button component={Link} to="/admin/schedule" variant="contained">
                  Schedule Messages
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;