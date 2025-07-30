export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'employee';
  organizationName: string;
  hourlyRate: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  check_in: string;
  check_out: string | null;
  total_hours: number;
  notes: string;
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  organization_id: number;
  user_id: number | null;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  total_hours: number;
  total_amount: number;
  billed_to: string;
  billed_to_address: string;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
  first_name?: string;
  last_name?: string;
  organization_name: string;
}

export interface AttendanceStatus {
  totalHours: any;
  checkOut: any;
  isCheckedIn: boolean;
  checkIn?: string;
  hoursWorked?: string;
  notes?: string;
}