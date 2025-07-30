import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Invoice } from '../types';
import { FileText, Plus, Calendar, User, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    hourlyRate: '',
    billedTo: '',
    billedToAddress: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
  }, []);

  const handleDownload = async (invoiceId: number, invoiceNumber: string) => {
    try {
      // const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}/download`, {
      const response = await fetch(`https://demo-api.payrollify.in/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  const handleDelete = async (invoiceId: number, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      try {
        await apiService.deleteInvoice(invoiceId);
        alert('Invoice deleted successfully!');
        fetchInvoices(); // Refresh the list
      } catch (error) {
        alert('Failed to delete invoice');
      }
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleUserChange = (userId: string) => {
    setCreateForm({ ...createForm, userId });
    
    // Auto-fill hourly rate when user is selected
    if (userId) {
      const selectedUser = users.find(user => user.id === parseInt(userId));
      if (selectedUser && selectedUser.hourly_rate > 0) {
        setCreateForm(prev => ({ 
          ...prev, 
          userId, 
          hourlyRate: selectedUser.hourly_rate.toString() 
        }));
      }
    } else {
      // Clear hourly rate when "All Team Members" is selected
      setCreateForm(prev => ({ ...prev, userId: '', hourlyRate: '' }));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createInvoice({
        userId: createForm.userId ? parseInt(createForm.userId) : undefined,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        hourlyRate: parseFloat(createForm.hourlyRate),
        billedTo: createForm.billedTo,
        billedToAddress: createForm.billedToAddress,
      });

      alert('Invoice created successfully!');
      setCreateForm({
        userId: '',
        startDate: '',
        endDate: '',
        hourlyRate: '',
        billedTo: '',
        billedToAddress: '',
      });
      setShowCreateForm(false);
      fetchInvoices();
    } catch (error) {
      alert('Failed to create invoice');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'draft':
  //       return 'bg-gray-100 text-gray-800';
  //     case 'sent':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'paid':
  //       return 'bg-green-100 text-green-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getTotalAmount = () => {
  //   return invoices.reduce((total, invoice) => total + invoice.total_amount, 0);
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-500 mt-1">Create and manage invoices for your team</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(getTotalAmount())}
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices.filter(i => i.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Member (Optional)
                  </label>
                  <select
                    value={createForm.userId}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Team Members</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} {user.hourly_rate > 0 && `($${user.hourly_rate}/hr)`}
                      </option>
                    ))}
                  </select>
                  {createForm.userId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Hourly rate auto-filled from user profile (editable)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={createForm.hourlyRate}
                    onChange={(e) => setCreateForm({ ...createForm, hourlyRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billed To
                </label>
                <input
                  type="text"
                  required
                  value={createForm.billedTo}
                  onChange={(e) => setCreateForm({ ...createForm, billedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client Name or Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  value={createForm.billedToAddress}
                  onChange={(e) => setCreateForm({ ...createForm, billedToAddress: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client address..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.first_name && invoice.last_name ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {invoice.first_name} {invoice.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">All Team</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(invoice.start_date)} - {formatDate(invoice.end_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.total_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          onClick={() => handleDownload(invoice.id, invoice.invoice_number)}
                        >
                          Download PDF
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center space-x-1"
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;