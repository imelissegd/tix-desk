import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="stub-page">
      <div className="stub-icon" style={{ color: '#ef4444' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h1 className="stub-title">Access Denied</h1>
      <p className="stub-desc">You don't have permission to view this page.</p>
      <button className="btn-primary" style={{ maxWidth: 200 }} onClick={() => navigate(-1)}>
        Go Back
      </button>
    </div>
  );
}