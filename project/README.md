# Hourly Attendance Management System

A comprehensive workforce tracking and billing solution built with React.js and MySQL, designed to streamline time management and invoice generation for organizations with hourly-based work structures.

## Features

### Core Functionality
- **Multi-tenant Organization Management**: Managers can create and manage their organizations
- **Team Member Invitations**: Email-based invitation system for onboarding team members
- **Secure Authentication**: Role-based login using organization name, email, and password
- **Real-time Time Tracking**: Check-in/check-out functionality with live status updates
- **Comprehensive Filtering**: Filter attendance records by date range and team member
- **Role-based Data Access**: Managers see all data, employees see only their own records
- **Automated Invoice Generation**: Create professional invoices with auto-incrementing numbers
- **Flexible Billing**: Generate invoices for any time period with customizable hourly rates

### Technical Features
- **React.js Frontend**: Modern, responsive user interface
- **MySQL Database**: Robust data storage with proper relationships
- **JWT Authentication**: Secure token-based authentication
- **Email Integration**: Automated invitation emails via Nodemailer
- **RESTful API**: Clean API architecture with Express.js
- **TypeScript Support**: Type-safe development experience

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v14 or higher)
2. **MySQL** (v5.7 or higher)
3. **npm** or **yarn** package manager

## Installation & Setup

### 1. Database Setup

1. Install and start MySQL server
2. Create a new database:
   ```sql
   CREATE DATABASE attendance_system;
   ```
3. Import the database schema:
   ```bash
   mysql -u root -p attendance_system < server/database.sql
   ```

### 2. Environment Configuration

1. Copy the `.env` file and update the values:
   ```bash
   cp .env .env.local
   ```

2. Update the following variables in `.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=attendance_system

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_secure_jwt_secret_key

   # Email Configuration (for invitations)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Server Configuration
   PORT=3001
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

Run both the backend server and frontend development server:

```bash
npm run dev:full
```

Or run them separately:

```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001

## Usage

### Getting Started

1. **Create Organization**: 
   - Visit the application and click "Create Organization"
   - Fill in your organization details and manager account information

2. **Invite Team Members**:
   - Navigate to the "Team" section
   - Click "Invite Member" and enter their email address
   - Team members will receive an email invitation

3. **Time Tracking**:
   - Use the Dashboard to check in/out
   - Add optional notes for each session
   - View real-time hours worked

4. **Generate Invoices**:
   - Go to "Invoices" section
   - Click "Create Invoice"
   - Select date range, hourly rate, and billing information
   - Invoice numbers are automatically generated

### Demo Credentials

For testing purposes, the system includes demo data:

- **Organization**: Demo Company
- **Manager**: manager@demo.com / password123
- **Employee**: employee@demo.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/create-organization` - Create new organization
- `POST /api/auth/login` - User login
- `POST /api/auth/invite` - Invite team member

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/status` - Get current status

### Users
- `GET /api/users` - Get all users (manager only)
- `PUT /api/users/:id/rate` - Update hourly rate (manager only)

### Invoices
- `POST /api/invoices` - Create invoice (manager only)
- `GET /api/invoices` - Get all invoices (manager only)
- `GET /api/invoices/:id` - Get specific invoice (manager only)

## Database Schema

The system uses the following main tables:

- **organizations**: Store organization information
- **users**: User accounts with role-based access
- **attendance**: Time tracking records
- **invoices**: Generated invoices with auto-incrementing numbers
- **invitations**: Email invitation tokens

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Managers and employees have different permissions
- **Password Hashing**: Bcrypt encryption for password security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository or contact the development team.