import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Trash2, Download, Filter, Search, Eye, X } from 'lucide-react';

const AdminPaymentDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Fetch payments from API
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/v1/admin/manual-payments?status=all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/admin/manual-payments/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await fetchPayments();
        setShowModal(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/admin/manual-payments/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await fetchPayments();
        setShowModal(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  const handleDeleteClick = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;

    try {
      const response = await fetch(`http://localhost:8080/api/v1/admin/manual-payments/${paymentToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchPayments();
        setShowDeleteModal(false);
        setPaymentToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const generateInvoicePDF = (payment) => {
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${payment._id.slice(-8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              background: #f8f9fa;
              padding: 40px 20px;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .invoice-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
            }
            .company-name {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-tagline {
              font-size: 14px;
              opacity: 0.9;
            }
            .invoice-title {
              text-align: right;
              margin-top: 20px;
            }
            .invoice-title h1 {
              font-size: 28px;
              margin-bottom: 5px;
            }
            .invoice-number {
              font-size: 14px;
              opacity: 0.9;
            }
            .invoice-body {
              padding: 40px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 2px solid #e9ecef;
            }
            .info-block h3 {
              color: #667eea;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 10px;
              letter-spacing: 1px;
            }
            .info-block p {
              color: #495057;
              line-height: 1.6;
              font-size: 14px;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            .details-table th {
              background: #f8f9fa;
              padding: 15px;
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
              color: #6c757d;
              border-bottom: 2px solid #dee2e6;
            }
            .details-table td {
              padding: 20px 15px;
              border-bottom: 1px solid #e9ecef;
              color: #495057;
            }
            .details-table td:first-child {
              font-weight: 500;
            }
            .total-section {
              margin-top: 40px;
              padding: 30px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 16px;
            }
            .total-row.grand-total {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              padding-top: 15px;
              border-top: 2px solid #dee2e6;
              margin-top: 15px;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-approved {
              background: #d4edda;
              color: #155724;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            .status-rejected {
              background: #f8d7da;
              color: #721c24;
            }
            .footer {
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #e9ecef;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
            .footer p {
              margin-bottom: 8px;
            }
            .notes-section {
              margin-top: 40px;
              padding: 20px;
              background: #fff9e6;
              border-left: 4px solid #ffc107;
              border-radius: 4px;
            }
            .notes-section h4 {
              color: #856404;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .notes-section p {
              color: #6c757d;
              font-size: 13px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div>
                <div class="company-name">Current</div>
                <div class="company-tagline">WhatsApp Business Solutions</div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">#INV-${payment._id.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div class="invoice-body">
              <div class="info-section">
                <div class="info-block">
                  <h3>Bill To</h3>
                  <p>
                    <strong>${payment.userId?.fullName || 'N/A'}</strong><br>
                    ${payment.userId?.email || 'N/A'}<br>
                    ${payment.userId?.phone || ''}
                  </p>
                </div>
                <div class="info-block" style="text-align: right;">
                  <h3>Invoice Details</h3>
                  <p>
                    <strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}<br>
                    <strong>Status:</strong><br>
                    <span class="status-badge status-${payment.status}">${payment.status}</span>
                  </p>
                </div>
              </div>

              <table class="details-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Plan Details</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>${payment.planId?.name || 'WhatsApp Plan'}</strong><br>
                      <small style="color: #6c757d;">Monthly Subscription</small>
                    </td>
                    <td>
                      ${payment.planId?.messages ? `${payment.planId.messages} Messages` : 'Unlimited Messages'}<br>
                      <small style="color: #6c757d;">Valid for 30 days</small>
                    </td>
                    <td style="text-align: right;">
                      <strong>${payment.currency} ${payment.amount.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${payment.currency} ${payment.amount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Tax (0%):</span>
                  <span>${payment.currency} 0.00</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total Amount:</span>
                  <span>${payment.currency} ${payment.amount.toFixed(2)}</span>
                </div>
              </div>

              ${payment.note ? `
                <div class="notes-section">
                  <h4>Payment Note</h4>
                  <p>${payment.note}</p>
                </div>
              ` : ''}

              <div class="footer">
                <p><strong>Current - WhatsApp Business Solutions</strong></p>
                <p>Email: support@current.com | Website: www.current.com</p>
                <p style="margin-top: 20px;">Thank you for your business!</p>
                <p style="margin-top: 15px; font-size: 10px;">
                  This is a computer-generated invoice. No signature required.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Current-Invoice-${payment._id.slice(-8).toUpperCase()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateAllInvoicesPDF = () => {
    const filteredPayments = getFilteredPayments();
    
    const invoicesHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Current - Invoice Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              background: #f8f9fa;
              padding: 40px 20px;
            }
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .report-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .company-name {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-tagline {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 20px;
            }
            .report-title {
              font-size: 28px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .report-date {
              font-size: 14px;
              opacity: 0.9;
            }
            .report-body {
              padding: 40px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            .summary-card {
              padding: 25px;
              border-radius: 12px;
              background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
              border-left: 4px solid #667eea;
            }
            .summary-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #6c757d;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .summary-value {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
            }
            .transactions-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
            }
            .transactions-table thead {
              background: #667eea;
              color: white;
            }
            .transactions-table th {
              padding: 15px;
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .transactions-table td {
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
              color: #495057;
            }
            .transactions-table tbody tr:hover {
              background: #f8f9fa;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-approved {
              background: #d4edda;
              color: #155724;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            .status-rejected {
              background: #f8d7da;
              color: #721c24;
            }
            .footer {
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #e9ecef;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <div class="company-name">Current</div>
              <div class="company-tagline">WhatsApp Business Solutions</div>
              <div class="report-title">Payment Invoice Report</div>
              <div class="report-date">Generated on ${new Date().toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })} at ${new Date().toLocaleTimeString('en-IN')}</div>
            </div>

            <div class="report-body">
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Total Transactions</div>
                  <div class="summary-value">${filteredPayments.length}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Total Revenue</div>
                  <div class="summary-value">₹${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Approved Payments</div>
                  <div class="summary-value">${filteredPayments.filter(p => p.status === 'approved').length}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Pending Reviews</div>
                  <div class="summary-value">${filteredPayments.filter(p => p.status === 'pending').length}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Rejected Payments</div>
                  <div class="summary-value">${filteredPayments.filter(p => p.status === 'rejected').length}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Approved Revenue</div>
                  <div class="summary-value">₹${filteredPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredPayments.map(payment => `
                    <tr>
                      <td><strong>#INV-${payment._id.slice(-8).toUpperCase()}</strong></td>
                      <td>${payment.userId?.fullName || 'N/A'}</td>
                      <td><small>${payment.userId?.email || 'N/A'}</small></td>
                      <td>${payment.planId?.name || 'Standard'}</td>
                      <td><strong>${payment.currency} ${payment.amount.toFixed(2)}</strong></td>
                      <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                      <td>${new Date(payment.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <p><strong>Current - WhatsApp Business Solutions</strong></p>
                <p>Email: support@current.com | Website: www.current.com</p>
                <p style="margin-top: 20px;">This is a computer-generated report.</p>
                <p style="margin-top: 10px; font-size: 10px; color: #adb5bd;">
                  © ${new Date().getFullYear()} Current. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([invoicesHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Current-Invoice-Report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      const matchesFilter = filter === 'all' || payment.status === filter;
      const matchesSearch = 
        payment.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment._id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = getFilteredPayments();
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-1">Manage and review manual payment requests</p>
            </div>
            <button
              onClick={generateAllInvoicesPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Export All Invoices
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {payments.filter(p => p.status === 'approved').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-900">
                {payments.filter(p => p.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No payments found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.userId?.fullName || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{payment.userId?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{payment.currency} {payment.amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => generateInvoicePDF(payment)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Download Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(payment)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User Name</p>
                  <p className="font-medium">{selectedPayment.userId?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedPayment.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{selectedPayment.currency} {selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{selectedPayment.method}</p>
                </div>
              </div>

              {selectedPayment.note && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">User Note</p>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedPayment.note}</p>
                </div>
              )}

              {selectedPayment.screenshotUrl && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Screenshot</p>
                  <img 
                    src={`http://localhost:8080${selectedPayment.screenshotUrl}`}
                    alt="Payment proof" 
                    className="w-full rounded-lg border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23ddd" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image not found</text></svg>';
                    }}
                  />
                </div>
              )}
            </div>

            {selectedPayment.status === 'pending' && (
              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => handleApprove(selectedPayment._id)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Payment
                </button>
                <button
                  onClick={() => handleReject(selectedPayment._id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && paymentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Delete Payment?
              </h2>
              
              <p className="text-gray-600 text-center mb-2">
                Are you sure you want to delete this payment from
              </p>
              <p className="text-gray-900 font-semibold text-center mb-6">
                {paymentToDelete.userId?.fullName || 'N/A'}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Invoice ID:</span>
                  <span className="text-sm font-medium text-gray-900">
                    #INV-{paymentToDelete._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentToDelete.currency} {paymentToDelete.amount}
                  </span>
                </div>
              </div>

              <p className="text-sm text-red-600 text-center mb-6 font-medium">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPaymentToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDashboard;