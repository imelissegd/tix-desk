import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../store/authStore';
import { authService } from '../../services/authService';

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
};

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: 'CLIENT', label: 'Client', desc: 'Submit and track tickets' },
  { value: 'AGENT',  label: 'Agent',  desc: 'Manage and resolve tickets' },
  { value: 'ADMIN',  label: 'Admin',  desc: 'Full system access' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { role: 'CLIENT' } });

  const selectedRole = watch('role');
  const passwordValue = watch('password');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const res = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      login(
        { userId: res.userId, name: res.name, email: res.email, role: res.role },
        res.accessToken,
        res.refreshToken
      );
      navigate(res.role === 'ADMIN' ? '/admin/users' : '/dashboard', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg: string = err?.response?.data?.message ?? '';
      if (status === 409 || msg.includes('already registered')) {
        setServerError('An account with this email already exists.');
      } else if (status === 400) {
        setServerError(msg || 'Please check your inputs.');
      } else {
        setServerError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">

        <div className="auth-brand">
          <div className="auth-logo">
            <span className="auth-logo-purple">Tix</span>
            <span className="auth-logo-blue">Desk</span>
          </div>
          <span className="auth-tagline">Ticketing System</span>
        </div>

        <div className="auth-divider" />
        <h1 className="auth-heading">Create Account</h1>

        {serverError && <div className="alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Name */}
          <div className="field-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrap">
              <span className="input-icon">&#128100;</span>
              <input
                id="name"
                type="text"
                placeholder="Jane Doe"
                className={errors.name ? 'input-error' : ''}
                autoComplete="name"
                autoFocus
                {...register('name', {
                  required: 'Name is required',
                  maxLength: { value: 100, message: 'Name must not exceed 100 characters' },
                })}
              />
            </div>
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <span className="input-icon">&#9993;</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={errors.email ? 'input-error' : ''}
                autoComplete="email"
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

          {/* Password + Confirm */}
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">&#128274;</span>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 chars"
                  className={errors.password ? 'input-error' : ''}
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm</label>
              <div className="input-wrap">
                <span className="input-icon">&#128274;</span>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'input-error' : ''}
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === passwordValue || 'Passwords do not match',
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Role selector */}
          <div className="field-group">
            <label>Role</label>
            <div className="role-grid">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('role', opt.value, { shouldValidate: true })}
                  className={`role-card ${selectedRole === opt.value ? 'role-card--active' : ''}`}
                >
                  <span className="role-card__label">{opt.label}</span>
                  <span className="role-card__desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('role', { required: 'Please select a role' })} />
            {errors.role && <p className="field-error">{errors.role.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>

        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}