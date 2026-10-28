import React, { useEffect, useState, useCallback } from 'react';
import { Users, BookOpen, CheckCircle, TrendingUp, Train, Bus, Map, Activity, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { DashboardStats } from '../../types/domain';
import { formatCurrency } from '../../utils/formatters';
import { Spinner, ErrorState, SectionHeader } from '../../components/common/UIComponents';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  const confirmationRate = stats.totalBookings > 0
    ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100)
    : 0;

  const kpiCards = [
    {
      icon: <Users size={19} className="text-brand-700" />,
      label: 'Total Passengers',
      value: stats.totalPassengers.toLocaleString(),
    },
    {
      icon: <BookOpen size={19} className="text-brand-700" />,
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      sub: `${stats.confirmedBookings} confirmed`,
    },
    {
      icon: <CheckCircle size={19} className="text-brand-700" />,
      label: 'Confirmed Bookings',
      value: stats.confirmedBookings.toLocaleString(),
      sub: `${confirmationRate}% confirmation rate`,
    },
    {
      icon: <TrendingUp size={19} className="text-brand-700" />,
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      sub: `${stats.pendingPayments} pending payments`,
      large: true,
    },
    {
      icon: <Activity size={19} className="text-brand-700" />,
      label: 'Active Schedules',
      value: stats.activeSchedules.toLocaleString(),
    },
    {
      icon: <Train size={19} className="text-brand-700" />,
      label: 'Trains',
      value: stats.totalTrains.toLocaleString(),
    },
    {
      icon: <Bus size={19} className="text-brand-700" />,
      label: 'Buses',
      value: stats.totalBuses.toLocaleString(),
    },
    {
      icon: <Map size={19} className="text-brand-700" />,
      label: 'Routes',
      value: stats.totalRoutes.toLocaleString(),
    },
  ];

  return (
    <div className="admin-page page-enter space-y-6">
      <SectionHeader
        title="Admin Dashboard"
        subtitle="System overview and key metrics"
        action={
          <button onClick={fetchStats} className="btn-ghost gap-1.5 text-sm">
            <RefreshCw size={14} />Refresh
          </button>
        }
      />

      {/* KPI Grid */}
      <dl className="grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map(card => (
          <div key={card.label} className="min-w-0 border-b border-r border-slate-200 px-3 py-4 sm:px-4">
            <dt className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              {card.icon}{card.label}
            </dt>
            <dd className={`tabular-nums font-semibold tracking-tight text-slate-900 ${card.large ? 'text-xl sm:text-2xl' : 'text-2xl'}`}>
              {card.value}
            </dd>
            {card.sub && <dd className="mt-1 text-xs text-slate-600">{card.sub}</dd>}
          </div>
        ))}
      </dl>

      {/* Booking breakdown */}
      <section className="glass-card p-5" aria-label="Booking status breakdown">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
          {[
            { label: 'Initiated', count: stats.totalBookings - stats.confirmedBookings - stats.cancelledBookings, color: 'text-slate-700', bar: 'bg-slate-600' },
            { label: 'Confirmed', count: stats.confirmedBookings, color: 'text-success-400', bar: 'bg-success-500' },
            { label: 'Cancelled', count: stats.cancelledBookings, color: 'text-danger-400', bar: 'bg-danger-500' },
          ].map(({ label, count, color, bar }) => {
            const pct = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0;
            return (
              <div key={label} className="min-w-0 border-l border-slate-200 py-2 pl-4">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`tabular-nums text-lg font-semibold ${color}`}>{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-500">
                  <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-600">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
