import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const res = await authService.login(values);
      login(
        { userId: res.userId, name: res.name, email: res.email, role: res.role },
        res.accessToken,
        res.refreshToken
      );
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setServerError('Invalid email or password.');
      } else {
        setServerError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-logo">
            <span className="auth-logo-purple">Tix</span>
            <span className="auth-logo-blue">Desk</span>
          </div>
          <span className="auth-tagline">Ticketing System</span>
        </div>

        <div className="auth-divider" />
        <h1 className="auth-heading">Login</h1>

        {serverError && <div className="alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <span className="input-icon">&#128100;</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={errors.email ? 'input-error' : ''}
                autoComplete="email"
                autoFocus
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email',
                  },
                })}
              />
            </div>
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">&#128274;</span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className={errors.password ? 'input-error' : ''}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>

        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

      </div>
    </div>
  );
}