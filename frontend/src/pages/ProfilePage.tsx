import React, { useState } from 'react';
import { User, Phone, Mail, Shield, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import { Spinner, SectionHeader, AccountStatusBadge } from '../components/common/UIComponents';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, passenger, account, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    name: passenger?.name ?? '',
    phoneNo: passenger?.phoneNo ?? '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [showPasses, setShowPasses] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      await authApi.updateProfile({ name: profile.name, phoneNo: profile.phoneNo });
      await refreshUser();
      setProfileSuccess(true);
      toast.success('Profile updated');
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePasswords = (): boolean => {
    const errs: Record<string, string> = {};
    if (!passwords.currentPassword) errs.currentPassword = 'Current password required';
    if (!passwords.newPassword || passwords.newPassword.length < 6) errs.newPassword = 'New password must be 6+ characters';
    if (passwords.newPassword !== passwords.confirmNew) errs.confirmNew = 'Passwords do not match';
    if (passwords.currentPassword === passwords.newPassword) errs.newPassword = 'New password must differ from current';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <SectionHeader title="Account settings" subtitle="Manage your personal information and sign-in security." />

      {/* Personal Information */}
      <section className="card-slate space-y-6 p-5 sm:p-6" aria-labelledby="profile-info-title">
        <h2 id="profile-info-title" className="text-lg font-semibold text-slate-900">Profile information</h2>
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-black shadow-brand">
            {(passenger?.name ?? user?.userName ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{passenger?.name ?? user?.userName}</h2>
            <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5 font-semibold">
              <Mail size={13} className="text-brand-600" />{user?.email}
            </p>
            {user?.createdAt && (
              <p className="text-slate-400 text-[11px] font-semibold mt-1">Passenger Account created on {formatDate(user.createdAt)}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="input-label" htmlFor="profile-name">Full name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="profile-name"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="input-field pl-10 font-semibold"
                placeholder="Your full name"
              />
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="profile-phone">Phone number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                id="profile-phone"
                value={profile.phoneNo}
                onChange={e => setProfile(p => ({ ...p, phoneNo: e.target.value }))}
                className="input-field pl-10 font-semibold"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="profile-email">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="profile-email" type="email" value={user?.email ?? ''} disabled className="input-field pl-10 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Email is tied to your login identity and cannot be edited.</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={profileLoading} className="btn-primary py-3 px-6 text-sm font-bold shadow-brand">
              {profileLoading ? <Spinner size="sm" /> : 'Save Profile Changes'}
            </button>
            {profileSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold animate-fade-in">
                <CheckCircle size={15} /> Changes saved successfully
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Account Status */}
      {account && (
        <section className="card-slate p-5 sm:p-6" aria-labelledby="account-status-title">
          <h3 id="account-status-title" className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-semibold text-slate-900">
            <Shield size={18} className="text-brand-700" /> Account status
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-slate-600 text-xs font-medium mb-1">Status</p>
              <AccountStatusBadge status={account.accountStatus} />
            </div>
            {account.lastLogin && (
              <div>
                <p className="text-slate-600 text-xs font-medium mb-1">Last login</p>
                <p className="text-slate-900 font-bold text-xs">{formatDate(account.lastLogin)}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Change Password */}
      <section className="card-slate p-5 sm:p-6" aria-labelledby="security-title">
        <h3 id="security-title" className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-semibold text-slate-900">
          <Lock size={18} className="text-brand-700" /> Security
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmNew'] as const).map(field => {
            const labels: Record<typeof field, string> = {
              currentPassword: 'Current Password',
              newPassword: 'New Password',
              confirmNew: 'Confirm New Password',
            };
            const showKey = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
            return (
              <div key={field}>
                <label className="input-label" htmlFor={`password-${field}`}>{labels[field]}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPasses[showKey as keyof typeof showPasses] ? 'text' : 'password'}
                    id={`password-${field}`}
                    value={passwords[field]}
                    onChange={e => { setPasswords(p => ({ ...p, [field]: e.target.value })); setPwErrors(errs => ({ ...errs, [field]: '' })); }}
                    placeholder="••••••••"
                    className={`input-field pl-10 pr-10 font-semibold ${pwErrors[field] ? 'border-rose-500' : ''}`}
                    autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasses(s => ({ ...s, [showKey]: !s[showKey as keyof typeof showPasses] }))}
                    aria-label={showPasses[showKey as keyof typeof showPasses] ? `Hide ${labels[field].toLowerCase()}` : `Show ${labels[field].toLowerCase()}`}
                    aria-pressed={showPasses[showKey as keyof typeof showPasses]}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPasses[showKey as keyof typeof showPasses] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors[field] && <p className="text-xs text-rose-600 font-bold mt-1">{pwErrors[field]}</p>}
              </div>
            );
          })}
          <button type="submit" disabled={pwLoading} className="btn-primary py-3 px-6 text-sm font-bold shadow-brand">
            {pwLoading ? <Spinner size="sm" /> : 'Update Password'}
          </button>
        </form>
      </section>

    </div>
  );
};

export default ProfilePage;
