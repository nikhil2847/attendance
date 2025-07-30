import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AttendanceView from './components/AttendanceView';
import TeamManagement from './components/TeamManagement';
import InvoiceManagement from './components/InvoiceManagement';
import Acceptinvitation from './components/Acceptinvitation';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/accept-invitation" element={<Acceptinvitation />} />
      <Route
        path="/*"
        element={
          !user ? (
            <Auth />
          ) : (
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              {(() => {
                switch (activeTab) {
                  case 'dashboard':
                    return <Dashboard />;
                  case 'attendance':
                    return <AttendanceView />;
                  case 'team':
                    return user.role === 'manager' ? <TeamManagement /> : <Dashboard />;
                  case 'invoices':
                    return user.role === 'manager' ? <InvoiceManagement /> : <Dashboard />;
                  default:
                    return <Dashboard />;
                }
              })()}
            </Layout>
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;