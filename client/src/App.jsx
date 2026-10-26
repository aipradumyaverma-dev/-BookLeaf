import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AuthorLayout from './layouts/AuthorLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthorDashboard from './pages/author/AuthorDashboard';
import MyBooks from './pages/author/MyBooks';
import SubmitTicket from './pages/author/SubmitTicket';
import MyTickets from './pages/author/MyTickets';
import TicketDetail from './pages/author/TicketDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketQueue from './pages/admin/TicketQueue';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';
import AuthorsList from './pages/admin/AuthorsList';
import './index.css';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/author'} replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Author Routes */}
          <Route path="/author" element={
            <ProtectedRoute role="author">
              <AuthorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AuthorDashboard />} />
            <Route path="books" element={<MyBooks />} />
            <Route path="submit-ticket" element={<SubmitTicket />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="tickets" element={<TicketQueue />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
            <Route path="authors" element={<AuthorsList />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
