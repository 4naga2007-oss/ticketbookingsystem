import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Receipt, XCircle, Search, RefreshCw, Ticket } from 'lucide-react';
import { reservationApi } from '../services/reservationApi';
import type { Booking, ScheduleWithDetails } from '../types/domain';
import { formatDate, formatCurrency } from '../utils/formatters';
import {
  SkeletonCard, EmptyState, ErrorState,
  BookingStatusBadge, ConfirmDialog
} from '../components/common/UIComponents';
import toast from 'react-hot-toast';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripsBySchedule, setTripsBySchedule] = useState<Record<number, ScheduleWithDetails>>({});
  const [tripDetailsNote, setTripDetailsNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'INITIATED' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reservationApi.getMyBookings();
      setBookings(res.data);
      const scheduleIds = [...new Set(res.data.map(booking => booking.scheduleId))];
      const tripResults = await Promise.allSettled(
        scheduleIds.map(async scheduleId => {
          const trip = await reservationApi.getTripDetails(scheduleId);
          return [scheduleId, trip.data] as const;
        }),
      );
      const availableTrips = tripResults.flatMap(result =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const unavailableCount = tripResults.length - availableTrips.length;
      setTripsBySchedule(Object.fromEntries(availableTrips));
      setTripDetailsNote(
        unavailableCount === 0
          ? ''
          : `Trip details could not be loaded for ${unavailableCount} ${unavailableCount === 1 ? 'schedule' : 'schedules'}.`,
      );
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await reservationApi.cancelBooking(cancelTarget);
      toast.success('Booking cancelled. Seats released.');
      setBookings(prev =>
        prev.map(b => b.bookingId === cancelTarget ? { ...b, bookingStatus: 'CANCELLED' } : b)
      );
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Cancellation failed.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.bookingStatus === filter);

  return (
    <div className="page-enter max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My bookings</h1>
          <p className="mt-1 text-sm text-slate-600">Review tickets and manage your reservations.</p>
        </div>
        <button onClick={fetchBookings} className="btn-secondary text-sm">
          <RefreshCw size={14} aria-hidden="true" />Refresh
        </button>
      </div>
      {tripDetailsNote && <p className="text-sm text-amber-800" role="status">{tripDetailsNote}</p>}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'CONFIRMED', 'INITIATED', 'CANCELLED'] as const).map(f => {
          const count = f === 'ALL' ? bookings.length : bookings.filter(b => b.bookingStatus === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === f
                  ? 'bg-brand-600 text-white border-brand-700 shadow-brand'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All Reservations' : f} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      )}

      {/* Error */}
      {error && <ErrorState message={error} onRetry={fetchBookings} />}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<BookOpen size={48} className="text-slate-400" />}
          title={filter === 'ALL' ? 'No Bookings Found' : `No ${filter.toLowerCase()} reservations`}
          description={filter === 'ALL' ? 'Book your first train or bus trip to get started.' : undefined}
          action={filter === 'ALL' ? <Link to="/search" className="btn-primary text-sm gap-2 font-bold"><Search size={16} />Find Trips Now</Link> : undefined}
        />
      )}

      {/* Bookings List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(booking => (
            <BookingCard
              key={booking.bookingId}
              booking={booking}
              trip={tripsBySchedule[booking.scheduleId]}
              onViewReceipt={() => navigate(`/booking-confirmation/${booking.bookingId}`)}
              onCompletePayment={() => navigate(`/payment/${booking.bookingId}`)}
              onCancel={() => setCancelTarget(booking.bookingId)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Confirm Booking Cancellation"
        message={`Are you sure you want to cancel Booking #${cancelTarget}? Reserved seats will be released back into inventory immediately.`}
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        variant="danger"
      />
    </div>
  );
};

// ─── Booking Card Component ──────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  trip?: ScheduleWithDetails;
  onViewReceipt: () => void;
  onCompletePayment: () => void;
  onCancel: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, trip, onViewReceipt, onCompletePayment, onCancel }) => {
  const seats = booking.passengerDetails.map(p => p.seatNumber).join(', ');
  const total = booking.passengerDetails.reduce((s, p) => s + p.fare, 0);
  const canCancel = booking.bookingStatus === 'INITIATED' || booking.bookingStatus === 'CONFIRMED';

  return (
    <article className="card-hover p-5 sm:p-6">
      
      {/* Info Column */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="tabular-nums font-mono text-xs font-semibold text-slate-600">
            #{booking.bookingId}
          </span>
          <BookingStatusBadge status={booking.bookingStatus} />
          <span className="text-xs font-semibold text-slate-500">
            Booked on {formatDate(booking.bookingDate)}
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-slate-200 pt-4">
          <div className="min-w-[13rem]">
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              {trip ? `${trip.route.source} to ${trip.route.destination}` : `Schedule #${booking.scheduleId}`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {trip ? `${formatDate(trip.journeyDate)} · ${trip.vehicleNameOrType}` : `${booking.passengerDetails.length} passenger(s)`}
            </p>
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Seats</dt>
              <dd className="mt-0.5 break-words font-mono text-sm font-medium text-slate-900">{seats}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Passengers</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">{booking.passengerDetails.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Total fare</dt>
              <dd className="tabular-nums mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {booking.bookingStatus === 'CONFIRMED' && (
          <button onClick={onViewReceipt} className="btn-primary text-sm">
            <Receipt size={14} />E-Ticket
          </button>
        )}
        {booking.bookingStatus === 'INITIATED' && (
          <button onClick={onCompletePayment} className="btn-primary text-sm">
            <Ticket size={14} />Complete Payment
          </button>
        )}
        {canCancel && (
          <button onClick={onCancel} className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50">
            <XCircle size={14} />Cancel Booking
          </button>
        )}
      </div>

    </article>
  );
};

export default MyBookingsPage;
