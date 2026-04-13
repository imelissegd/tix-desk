import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// ── Active-aware nav link ────────────────────────────────────────────
interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}

const NavLink = ({ to, children, exact = false }: NavLinkProps) => {
  const { pathname } = useLocation();

  const active = exact
    ? pathname === to
    : pathname === to || pathname.startsWith(to + '/');

  return (
    <Link to={to} className={`nav-link ${active ? 'nav-link--active' : ''}`}>
      {children}
    </Link>
  );
};

// ── SVG icons ────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  tickets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="12" y2="17" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  newTicket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ── Navbar ───────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <nav className="navbar">

      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">
          <span className="navbar-logo-purple">Tix</span>
          <span className="navbar-logo-blue">Desk</span>
        </span>
        <span className="navbar-tagline">Ticketing System</span>
      </Link>

      <div className="navbar-links">

        {/* ── ADMIN ── */}
        {user.role === 'ADMIN' && (
          <>
            <NavLink to="/admin/dashboard">
              {Icons.dashboard}
              Dashboard
            </NavLink>
            <NavLink to="/admin/tickets">
              {Icons.tickets}
              Tickets
            </NavLink>
            <NavLink to="/admin/users">
              {Icons.users}
              Users
            </NavLink>
            <NavLink to="/admin/reports">
              {Icons.reports}
              Reports
            </NavLink>
          </>
        )}

        {/* ── AGENT ── */}
        {user.role === 'AGENT' && (
          <>
            <NavLink to="/agent/queue">
              {Icons.queue}
              My Queue
            </NavLink>
            <NavLink to="/agent/tickets">
              {Icons.tickets}
              All Tickets
            </NavLink>
            <NavLink to="/profile">
              {Icons.profile}
              Profile
            </NavLink>
          </>
        )}

        {/* ── CLIENT ── */}
        {user.role === 'CLIENT' && (
          <>
            <NavLink to="/client/tickets" exact>
              {Icons.tickets}
              My Tickets
            </NavLink>
            <NavLink to="/client/tickets/new">
              {Icons.newTicket}
              New Ticket
            </NavLink>
            <NavLink to="/profile">
              {Icons.profile}
              Profile
            </NavLink>
          </>
        )}

        {/* ── User info + logout (all roles) ── */}
        <div className="navbar-user">
          <span className="navbar-user-info">
            <span className="navbar-username">Logged in as: {user.name}</span>
            <span className="navbar-role">Role: {user.role}</span>
          </span>
          <button className="nav-btn-logout" onClick={handleLogout}>
            {Icons.logout}
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}