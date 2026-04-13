import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="stub-page">
      <div className="stub-icon" style={{ color: '#9333ea' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
      <h1 className="stub-title">Profile</h1>

      {user && (
        <div className="stub-profile-card">
          <div className="stub-profile-row">
            <span className="stub-profile-label">Name</span>
            <span className="stub-profile-value">{user.name}</span>
          </div>
          <div className="stub-profile-row">
            <span className="stub-profile-label">Email</span>
            <span className="stub-profile-value">{user.email}</span>
          </div>
          <div className="stub-profile-row">
            <span className="stub-profile-label">Role</span>
            <span className="stub-profile-value">{user.role}</span>
          </div>
        </div>
      )}

    </div>
  );
}