const API_BASE_URL = 'http://localhost:3001/api';
// const API_BASE_URL = 'https://demo-api.payrollify.in/api';


class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }



  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      return data;
    } catch (error: any) {
      console.error('API error:', error);
      throw new Error(error.message || 'Request failed');
    }
  }


  // Auth
  async createOrganization(data: {
    organizationName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.request('/auth/create-organization', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: {
    organizationName: string;
    email: string;
    password: string;
  }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async inviteUser(data: { email: string; role: string }) {
    return this.request('/auth/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Attendance
  async checkIn(notes?: string) {
    return this.request('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async checkOut(notes?: string) {
    return this.request('/attendance/checkout', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getAttendanceRecords(filters: {
    startDate?: string;
    endDate?: string;
    userId?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    return this.request(`/attendance?${params.toString()}`);
  }

  async getAttendanceStatus() {
    return this.request('/attendance/status');
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async updateUserRate(userId: number, hourlyRate: number) {
    return this.request(`/users/${userId}/rate`, {
      method: 'PUT',
      body: JSON.stringify({ hourlyRate }),
    });
  }

  // Invoices
  async createInvoice(data: {
    userId?: number;
    startDate: string;
    endDate: string;
    hourlyRate: number;
    billedTo: string;
    billedToAddress: string;
  }) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async updateInvoice(invoiceId: number, data: {
    userId?: number;
    startDate?: string;
    endDate?: string;
    hourlyRate?: number;
    billedTo?: string;
    billedToAddress?: string;
  }) {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createUserCredentials(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    hourlyRate?: number;
  }) {
    return this.request('/auth/create-credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptInvitation(data: {
    token: string | null;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    return this.request('/auth/accept-invitation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoices() {
    return this.request('/invoices');
  }

  async getInvoice(invoiceId: number) {
    return this.request(`/invoices/${invoiceId}`);
  }


}

export const apiService = new ApiService();