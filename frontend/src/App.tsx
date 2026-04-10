import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './app/shared/guards/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/register" element={<div>Register Page</div>} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/tickets" element={<div>Tickets</div>} />
          <Route path="/tickets/:id" element={<div>Ticket Detail</div>} />
          <Route path="/users" element={<div>Users</div>} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;