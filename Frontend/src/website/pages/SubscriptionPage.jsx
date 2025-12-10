import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  Box,
  CircularProgress,
  Chip,
  Button,
  Paper
} from "@mui/material";
import axios from "axios";

const SubscriptionPage = () => {
  const [planDetails, setPlanDetails] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data: active } = await axios.get(
        "http://localhost:8080/user/active-plan",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (active.planId) {
        const plan = await axios.get(`http://localhost:8080/pricing/${active.planId}`);
        setPlanDetails(plan.data);
      }

      const logs = await axios.get(
        "http://localhost:8080/api/v1/payments/manual",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentLogs(logs.data.payments);

    } catch (err) {
      console.error("Fetching error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => fetchData(), []);

  if (loading) return <CircularProgress sx={{ m: 5 }} />;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
        📦 Your Subscription
      </Typography>

      {planDetails ? (
        <Card sx={{ p: 3, borderRadius: 4, mb: 4 }}>
          <Typography variant="h5" fontWeight={700}>
            {planDetails.name}
          </Typography>

          <Typography sx={{ mt: 1 }}>💰 Price: ₹{planDetails.price}</Typography>
          <Typography sx={{ mt: 1 }}>
            ✉ Messages: {planDetails.messages}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            🛠 Support: {planDetails.supportLevel}
          </Typography>

          <Typography sx={{ mt: 3, fontWeight: 700 }}>Features:</Typography>
          <Box sx={{ mt: 2 }}>
            {planDetails.features?.map((f, i) => (
              <Chip key={i} sx={{ mr: 1, mt: 1 }} label={f} />
            ))}
          </Box>

          <Button
            variant="contained"
            sx={{ mt: 3, width: "100%", borderRadius: 3 }}
            onClick={() => alert("Upgrade workflow here")}
          >
            Upgrade Plan
          </Button>
        </Card>
      ) : (
        <Typography>No active subscription.</Typography>
      )}

      <Typography variant="h5" sx={{ mb: 2 }} fontWeight={700}>
        📜 Payment History
      </Typography>

      {paymentLogs.length ? (
        paymentLogs.map((log, i) => (
          <Paper key={i} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography>Amount: ₹{log.amount}</Typography>
            <Typography>Status: {log.status}</Typography>
            <Typography>Date: {new Date(log.createdAt).toLocaleDateString()}</Typography>
          </Paper>
        ))
      ) : (
        <Typography>No payment records found.</Typography>
      )}

      <Button
        variant="outlined"
        sx={{ mt: 4, borderRadius: 3 }}
        fullWidth
        onClick={() => window.location.href = "/dashboard"}
      >
        ← Back to Dashboard
      </Button>
    </Container>
  );
};

export default SubscriptionPage;
