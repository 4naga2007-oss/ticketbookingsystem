import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Ticket, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight,
  X, KeyRound, CheckCircle2, RefreshCw, Copy, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/UIComponents';

const API = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Forgot Password Modal ────────────────────────────────────────────────────
type FpStep = 'email' | 'code' | 'newpass' | 'done';

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<FpStep>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const clearError = () => setError('');

  // Step 1: request reset code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Request failed');
      const token = json?.data?.resetToken ?? '';
      setResetToken(token);
      setStep('code');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: user copies code → proceeds to enter new password
  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: just show it
    }
  };

  const handleProceedToNewPass = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const entered = manualToken.trim().toUpperCase();
    if (!entered) { setError('Please enter the reset code.'); return; }
    if (resetToken && entered !== resetToken.toUpperCase()) {
      setError('The code you entered does not match. Please copy it exactly.');
      return;
    }
    setStep('newpass');
  };

  // Step 3: submit new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const token = resetToken || manualToken.trim().toUpperCase();
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Reset failed');
      setStep('done');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white">
              <KeyRound size={15} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Reset Password</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-6 pt-4">
          {(['email', 'code', 'newpass'] as FpStep[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === 'done' || ['email','code','newpass'].indexOf(step) > i
                    ? 'bg-brand-800 text-white'
                    : step === s
                    ? 'bg-brand-800 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step === 'done' || ['email','code','newpass'].indexOf(step) > i ? <Check size={12} /> : i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${['email','code','newpass'].indexOf(step) > i || step === 'done' ? 'bg-brand-800' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 py-5">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 mb-4 text-xs font-semibold animate-fade-in">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* ── Step 1: Enter Email ── */}
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Enter your registered email address. We'll generate a reset code for you.
                </p>
                <label className="input-label" htmlFor="fp-email">Email address</label>
                <div className="relative mt-1">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    placeholder="e.g. alice@email.com"
                    className="input-field pl-10 font-semibold"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size="sm" /> : <>Get Reset Code <ArrowRight size={15} /></>}
              </button>
            </form>
          )}

          {/* ── Step 2: Show / Copy Code ── */}
          {step === 'code' && (
            <form onSubmit={handleProceedToNewPass} className="space-y-4">
              <p className="text-sm text-slate-600">
                Your reset code has been generated. Copy it and enter it below to continue.
              </p>

              {resetToken ? (
                <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1 font-medium">YOUR RESET CODE</p>
                  <p className="text-3xl font-mono font-black tracking-[0.35em] text-brand-800 select-all">
                    {resetToken}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                  >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy code</>}
                  </button>
                  <p className="text-xs text-slate-400 mt-1.5">⏱ Expires in 15 minutes</p>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-medium">
                  If <strong>{email}</strong> is registered, a code was generated. Enter it below.
                </div>
              )}

              <div>
                <label className="input-label" htmlFor="fp-token">Enter reset code</label>
                <input
                  id="fp-token"
                  type="text"
                  value={manualToken}
                  onChange={e => { setManualToken(e.target.value.toUpperCase()); clearError(); }}
                  placeholder="e.g. A3F9C2"
                  maxLength={6}
                  className="input-field mt-1 font-mono text-center tracking-widest text-lg font-bold uppercase"
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                Continue <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'newpass' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-600 mb-1">Choose a strong new password.</p>

              <div>
                <label className="input-label" htmlFor="fp-newpass">New password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fp-newpass"
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); clearError(); }}
                    placeholder="Min. 6 characters"
                    className="input-field pl-10 pr-10 font-semibold"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="fp-confirm">Confirm new password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fp-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                    placeholder="Re-enter password"
                    className="input-field pl-10 pr-10 font-semibold"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Strength hint */}
              {newPassword && (
                <div className="flex gap-1 h-1">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors ${
                        newPassword.length >= i * 3
                          ? newPassword.length >= 10 ? 'bg-green-500' : newPassword.length >= 6 ? 'bg-amber-400' : 'bg-rose-400'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size="sm" /> : <>Reset Password <ArrowRight size={15} /></>}
              </button>
            </form>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={30} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Password Updated!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <button onClick={onClose} className="btn-primary w-full py-2.5">
                Back to Sign In <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emailOrUsername.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      const target = (from === '/' || from === '/login') ? '/home' : from;
      navigate(target, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="auth-layout mx-auto grid w-full max-w-5xl items-center gap-10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <div className="max-w-md space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-800 text-white mb-2">
              <Ticket size={23} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-slate-600 text-sm leading-6">Sign in to view your reservations and travel details.</p>
          </div>

          {/* Side panel */}
          <div className="auth-support hidden border-l border-slate-200 pl-8 lg:block">
            <p className="max-w-sm text-lg leading-8 text-slate-700">Your trips, tickets, and account details stay together, ready when you need them.</p>
          </div>
        </div>

        <div className="auth-form card-slate p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 mb-5 animate-fade-in text-xs font-bold">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-600" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="login-identity">Email or Username</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="login-identity"
                  name="emailOrUsername"
                  value={form.emailOrUsername}
                  onChange={handleChange}
                  placeholder="e.g. alice@email.com"
                  className="input-field pl-10 font-semibold"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="input-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={11} />
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10 font-semibold"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  aria-pressed={showPass}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full py-3 text-base"
            >
              {loading ? <Spinner size="sm" /> : <>Sign in <ArrowRight size={16} aria-hidden="true" /></>}
            </button>
          </form>

          <p className="text-center text-slate-600 text-sm mt-4">
            New to TransitBook?{' '}
            <Link to="/register" className="font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
