import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import PublicTopbar from './components/Layout/PublicTopbar';
import PublicHomepage from './pages/PublicHomepage';
import StreamViewer from './pages/StreamViewer';
import Dashboard from './pages/Dashboard';
import Configurations from './pages/Configurations';
import Teams from './pages/Teams';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import './i18n';

// Public Layout Component
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <PublicTopbar />
      <main>
        {children}
      </main>
    </div>
  );
};

// Dashboard Layout Component (Private/Protected)
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const DashboardLayout: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicLayout>
            <PublicHomepage />
          </PublicLayout>
        } />
        <Route path="/stream/:streamId" element={<StreamViewer />} />
        
        {/* Dashboard Routes (Protected) */}
        <Route path="/dashboard" element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        } />
        <Route path="/dashboard/configurations" element={
          <DashboardLayout>
            <Configurations />
          </DashboardLayout>
        } />
        <Route path="/dashboard/teams" element={
          <DashboardLayout>
            <Teams />
          </DashboardLayout>
        } />
        <Route path="/dashboard/profile" element={
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        } />
        <Route path="/dashboard/admin" element={
          <DashboardLayout adminOnly={true}>
            <Admin />
          </DashboardLayout>
        } />
        
        {/* Redirect old routes to new dashboard routes */}
        <Route path="/configurations" element={<Navigate to="/dashboard/configurations" replace />} />
        <Route path="/teams" element={<Navigate to="/dashboard/teams" replace />} />
        <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
          },
        }}
      />
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;