import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Auth
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminTickets from './components/admin/AdminTickets';
import AdminUsers from './components/admin/AdminUsers';
import AdminReports from './components/admin/AdminReports';

// Agent
import AgentQueue from './components/agent/AgentQueue';
import AgentTickets from './components/agent/AgentTickets';

// Client
import ClientTickets from './components/client/ClientTickets';
import ClientNewTicket from './components/client/ClientNewTicket';

// Shared
import ProfilePage from './components/ProfilePage';
import UnauthorizedPage from './components/UnauthorizedPage';
import Navbar from './components/Navbar';

import AuthGuard, { RoleGuard } from './AuthGuard';

function RoleHome() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent/queue" replace />;
  return <Navigate to="/client/tickets" replace />;
}

function GuestGuard() {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user) logout();
  }, []);

  return <Outlet />;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  return (
    <BrowserRouter>

      {/* ✅ Navbar ONLY when logged in */}
      {isLoggedIn && <Navbar />}

      {/* ✅ Padding ONLY when logged in */}
      <main className={isLoggedIn ? 'main-content' : ''}>
        <Routes>

          {/* Public */}
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root */}
          <Route path="/" element={<RoleHome />} />

          {/* ── ADMIN ── */}
          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          {/* ── AGENT ── */}
          <Route element={<RoleGuard roles={['AGENT']} />}>
            <Route path="/agent/queue" element={<AgentQueue />} />
            <Route path="/agent/tickets" element={<AgentTickets />} />
          </Route>

          {/* ── CLIENT ── */}
          <Route element={<RoleGuard roles={['CLIENT']} />}>
            <Route path="/client/tickets" element={<ClientTickets />} />
            <Route path="/client/tickets/new" element={<ClientNewTicket />} />
          </Route>

          {/* Any authenticated user */}
          <Route element={<AuthGuard />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>

    </BrowserRouter>
  );
}