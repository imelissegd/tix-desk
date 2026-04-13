import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type Role } from './store/authStore';

// ── Basic auth guard ─────────────────────────────────────────────────
export default function AuthGuard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}

// ── Role-based guard ─────────────────────────────────────────────────
interface RoleGuardProps {
  roles: Role[];
}

export function RoleGuard({ roles }: RoleGuardProps) {
  // ✅ Two separate selectors — each returns a stable primitive/reference,
  //    not a new object on every render.
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}