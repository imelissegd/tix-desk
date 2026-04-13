import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

function LoggedInView() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>You are logged in</h1>
      <button onClick={handleLogout} style={{ marginTop: '1rem' }}>
        [Click here to log out]
      </button>
    </div>
  );
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  return (
    <BrowserRouter>
      <Routes>
        {/* If NOT logged in */}
        {!isLoggedIn ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* If logged in → show static page with logout */
          <>
            <Route path="*" element={<LoggedInView />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}