import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/UIComponents';

interface FormState {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phoneNo: string;
}

interface FormErrors {
  userName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  phoneNo?: string;
  general?: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    userName: '', email: '', password: '', confirmPassword: '', name: '', phoneNo: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.userName.trim()) e.userName = 'Username is required.';
    else if (form.userName.length < 3) e.userName = 'Username must be at least 3 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phoneNo.trim()) e.phoneNo = 'Phone number is required.';
    else if (!/^\+?[\d\s-]{10,15}$/.test(form.phoneNo)) e.phoneNo = 'Enter a valid phone number.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors(err => ({ ...err, [e.target.name]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await register({
        userName: form.userName,
        email: form.email,
        password: form.password,
        name: form.name,
        phoneNo: form.phoneNo,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Registration failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (): { label: string; color: string; width: string } => {
    const p = form.password;
    if (!p) return { label: '', color: '', width: '0%' };
    if (p.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (p.length < 8 || !/[A-Z]/.test(p) || !/[0-9]/.test(p))
      return { label: 'Fair', color: 'bg-amber-500', width: '55%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <div className="auth-layout mx-auto grid w-full max-w-6xl items-start gap-8 py-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-12">
      <div className="max-w-md space-y-4 lg:sticky lg:top-28">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-800 text-white mb-2">
            <Ticket size={23} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-slate-600 text-sm leading-6">Save your passenger details and manage upcoming reservations.</p>
        </div>
        <div className="hidden border-l border-slate-200 pl-6 text-sm leading-6 text-slate-600 lg:block">
          Your email becomes your sign-in identity. You can update your profile details later.
        </div>
      </div>

        {/* Card */}
        <div className="auth-form card-slate p-6 sm:p-8">
          {errors.general && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 mb-5 animate-fade-in text-xs font-bold">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-600" />
              <p>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label" htmlFor="register-name">Full name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" id="register-name" name="name" value={form.name} onChange={handleChange}
                    placeholder="Priya Sharma" className="input-field pl-10 font-semibold" disabled={loading}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 font-bold mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="input-label" htmlFor="register-phone">Phone number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel" id="register-phone" name="phoneNo" value={form.phoneNo} onChange={handleChange}
                    placeholder="+91 98765 43210" className="input-field pl-10 font-semibold" disabled={loading}
                  />
                </div>
                {errors.phoneNo && <p className="text-xs text-rose-600 font-bold mt-1">{errors.phoneNo}</p>}
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="register-username">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">@</span>
                <input
                  type="text" id="register-username" name="userName" value={form.userName} onChange={handleChange}
                  placeholder="priya_sharma" className="input-field pl-10 font-semibold" disabled={loading}
                  autoComplete="username"
                />
              </div>
              {errors.userName && <p className="text-xs text-rose-600 font-bold mt-1">{errors.userName}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="register-email">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" id="register-email" name="email" value={form.email} onChange={handleChange}
                  placeholder="priya@example.com" className="input-field pl-10 font-semibold" disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 font-bold mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="register-password">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'} id="register-password" name="password" value={form.password}
                  onChange={handleChange} placeholder="Min 6 characters"
                  className="input-field pl-10 pr-10 font-semibold" disabled={loading} autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'} aria-pressed={showPass}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{strength.label}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-rose-600 font-bold mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="register-confirm-password">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password" id="register-confirm-password" name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} placeholder="Re-enter password"
                  className="input-field pl-10 pr-10 font-semibold" disabled={loading} autoComplete="new-password"
                />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-rose-600 font-bold mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3 text-base">
              {loading ? <Spinner size="sm" /> : <>Create account <ArrowRight size={16} aria-hidden="true" /></>}
            </button>
          </form>

        <p className="mt-5 text-center text-slate-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;
