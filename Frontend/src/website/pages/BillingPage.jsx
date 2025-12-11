import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Calendar, Package, Download, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import axios from "axios";

const BillingPage = () => {
  const [activePlan, setActivePlan] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const loadBilling = async () => {
    try {
      // Fetch active plan
      const { data: active } = await axios.get(
        "http://localhost:8080/user/active-plan",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (active?.planId) {
        const plan = await axios.get(
          `http://localhost:8080/pricing/${active.planId}`
        );
        setActivePlan({ ...plan.data, ...active });
      }

      // Fetch manual payment logs
      const logs = await axios.get(
        "http://localhost:8080/api/v1/payments/manual",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentLogs(logs.data.payments || []);
    } catch (err) {
      console.error("Billing error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and payment history</p>
        </div>
        <Link
          to="/user/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>

      {/* Active Subscription Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-8 h-8" />
          <h2 className="text-xl font-bold">Current Subscription</h2>
        </div>

        {activePlan ? (
          <div className="space-y-3">
            <div>
              <p className="text-blue-100 text-sm mb-1">Plan Name</p>
              <p className="text-2xl font-bold">{activePlan.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-400">
              <div>
                <p className="text-blue-100 text-sm mb-1">Messages Used</p>
                <p className="text-lg font-semibold">
                  {activePlan.messagesUsed} / {activePlan.totalMessages}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Expires On</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar size={18} />
                  {new Date(activePlan.expiryAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Link
              to="/user/pricing"
              className="inline-block mt-4 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Upgrade Plan
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-blue-100 mb-4">No active subscription</p>
            <Link
              to="/user/pricing"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Choose a Plan
            </Link>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        </div>

        {paymentLogs.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No payment records available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentLogs.map((log, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {log.planId?.name || "Unknown Plan"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusColor(
                      log.status
                    )}`}
                  >
                    {getStatusIcon(log.status)}
                    {log.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-gray-900">₹{log.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {log.method}
                    </p>
                  </div>
                </div>

                {log.screenshotUrl && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Payment Screenshot</p>
                    <img
                      src={`http://localhost:8080${log.screenshotUrl}`}
                      alt="Payment Screenshot"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <button
                  onClick={() => alert("Invoice download coming soon")}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  <Download size={16} />
                  Download Invoice
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;