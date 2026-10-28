import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminUserRow, AccountStatus } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { SkeletonRow, EmptyState, ErrorState, AccountStatusBadge, ConfirmDialog, SectionHeader } from '../../components/common/UIComponents';
import { getInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusTarget, setStatusTarget] = useState<{ userId: number; status: AccountStatus } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    setUpdating(true);
    try {
      await adminApi.updateUserStatus(statusTarget.userId, statusTarget.status);
      toast.success(`Account status updated to ${statusTarget.status}`);
      setUsers(prev =>
        prev.map(u => u.userId === statusTarget.userId ? { ...u, accountStatus: statusTarget.status } : u)
      );
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Update failed');
    } finally {
      setUpdating(false);
      setStatusTarget(null);
    }
  };

  const filtered = users.filter(u =>
    !search.trim() ||
    u.userName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.passengerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const statusOptions: AccountStatus[] = ['Active', 'Inactive', 'Suspended'];

  return (
    <div className="admin-page page-enter space-y-6">
      <SectionHeader
        title="User Management"
        subtitle={`${users.filter(u => u.role === 'PASSENGER').length} passengers · ${users.filter(u => u.role === 'ADMIN').length} admins`}
        action={
          <button onClick={fetchUsers} className="btn-ghost gap-1.5 text-sm">
            <RefreshCw size={14} />Refresh
          </button>
        }
      />

      <div className="relative max-w-md">
        <label className="sr-only" htmlFor="admin-user-search">Search users</label>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="admin-user-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search username, email, or name…"
          className="input-field pl-9 py-2.5 text-sm"
        />
      </div>

      {error && <ErrorState message={error} onRetry={fetchUsers} />}

      {!error && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label="Users table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Role</th>
                  <th>Passenger Info</th><th>Member Since</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                  ? <tr><td colSpan={7}><EmptyState icon={<Search size={36} />} title="No users found" /></td></tr>
                  : filtered.map(u => (
                    <tr key={u.userId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getInitials(u.passengerName ?? u.userName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{u.userName}</p>
                            {u.passengerName && <p className="text-xs text-slate-500">{u.passengerName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-slate-400">{u.email}</td>
                      <td>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-brand-600/20 text-brand-300' : 'bg-surface-500/60 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-sm text-slate-400">
                        {u.phoneNo ?? 'Not provided'}
                      </td>
                      <td className="text-sm text-slate-400">{u.createdAt ? formatDate(u.createdAt) : 'Not available'}</td>
                      <td>
                        {u.accountStatus ? <AccountStatusBadge status={u.accountStatus} /> : <span className="text-slate-500 text-xs">Not available</span>}
                      </td>
                      <td>
                        {u.accountStatus && (
                          <div className="relative group">
                            <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.12]">
                              Change <ChevronDown size={11} />
                            </button>
                            <div className="absolute right-0 top-7 hidden group-focus-within:block group-hover:block z-10 glass-card p-1 min-w-[130px]">
                              {statusOptions
                                .filter(s => s !== u.accountStatus)
                                .map(status => (
                                  <button
                                    key={status}
                                    onClick={() => setStatusTarget({ userId: u.userId, status })}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] rounded-lg transition"
                                  >
                                    Set {status}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={statusTarget !== null}
        title="Change Account Status"
        message={`Set account status to "${statusTarget?.status}" for user #${statusTarget?.userId}?`}
        confirmLabel={updating ? 'Updating…' : 'Confirm'}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusTarget(null)}
        variant="warning"
      />
    </div>
  );
};
