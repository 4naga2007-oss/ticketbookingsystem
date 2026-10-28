import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle, Printer, Calendar,
  Users, CreditCard, ArrowRight, Ticket, BookOpen
} from 'lucide-react';
import { paymentApi } from '../services/paymentApi';
import type { Receipt, Payment } from '../types/domain';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import { Spinner, ErrorState, PaymentStatusBadge } from '../components/common/UIComponents';

interface ReceiptData {
  payment: Payment;
  receipt: Receipt;
  booking: { bookingId: number; bookingStatus: string };
}

export const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReceipt = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    try {
      const res = await paymentApi.getReceipt(Number(bookingId));
      setData(res.data as unknown as ReceiptData);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load receipt.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchReceipt(); }, [fetchReceipt]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchReceipt} />;
  if (!data) return null;

  const receipt = (data as any).receipt || data;
  const booking = (data as any).booking || { bookingId: Number(bookingId), bookingStatus: 'CONFIRMED' };
  const rd = receipt?.receiptData || (receipt as any);

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Success Hero Banner */}
      <div className="card-slate flex items-center gap-4 border-emerald-200 p-5 sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          <CheckCircle size={23} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Confirmed</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Your booking is confirmed</h1>
          <p className="mt-1 text-sm text-slate-600">Your e-ticket is ready to print or view again from My Bookings.</p>
        </div>
      </div>

      {/* E-Ticket Card */}
      <article id="eticket" className="ticket-print card-slate overflow-hidden border border-slate-300">
        
        {/* Ticket Header Banner */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-white">
              <Ticket size={20} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">E-ticket</span>
              <span className="text-lg font-semibold tracking-tight text-slate-900">TransitBook</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-xs font-medium text-slate-500">Ticket number</span>
            <span className="tabular-nums font-mono text-base font-semibold text-slate-900">{receipt.ticketNumber}</span>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Route & Vehicle Bar */}
          <div className="grid grid-cols-2 items-center gap-4 border-y border-slate-200 py-5 sm:grid-cols-[1fr_auto_1fr]">
            <div className="text-left">
              <span className="text-xs font-medium text-slate-500">From</span>
              <p className="tabular-nums text-2xl font-semibold text-slate-900">{formatTime(rd.departureTime)}</p>
              <p className="text-sm font-bold text-slate-700">{rd.routeSource}</p>
            </div>

            <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 sm:col-span-1 sm:flex-col">
              <ArrowRight size={16} className="text-brand-800" aria-hidden="true" />
              <span>{rd.vehicleType} / {rd.vehicleNameOrType}</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">To</span>
              <p className="text-sm font-bold text-slate-700">{rd.routeDestination}</p>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
            <InfoBlock icon={<Calendar size={14} className="text-brand-600" />} label="Travel Date" value={formatDate(rd.journeyDate)} />
            <InfoBlock icon={<Users size={14} className="text-brand-700" />} label="Reserved seats" value={rd.seats.join(', ')} />
            <InfoBlock icon={<CreditCard size={14} className="text-brand-700" />} label="Payment method" value={rd.paymentMethod} />
            <InfoBlock label="Booking ID" value={`#${booking.bookingId}`} />
            <InfoBlock label="Amount paid" value={formatCurrency(rd.totalAmount)} highlight />
            <InfoBlock label="Payment status">
              <PaymentStatusBadge status={rd.paymentStatus} />
            </InfoBlock>
          </div>

          {/* Primary Passenger */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-5">
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-0.5">Passenger</span>
              <p className="text-base font-extrabold text-slate-900">{rd.passengerName}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 block mb-0.5">Seats</span>
              <span className="text-sm font-semibold text-slate-900">{rd.seats.length}</span>
            </div>
          </div>

          {/* E-Ticket Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 gap-2">
            <span>Receipt #{receipt.receiptId}</span>
            <span>Issued On: {formatDate(receipt.generateDate)}</span>
          </div>

        </div>
      </article>

      {/* Action Buttons */}
      <div className="ticket-actions flex flex-wrap gap-3 pt-2">
        <button onClick={handlePrint} className="btn-secondary py-3 px-6 text-sm font-bold gap-2">
          <Printer size={16} />Print E-Ticket
        </button>
        <Link to="/bookings" className="btn-secondary py-3 px-6 text-sm font-bold gap-2">
          <BookOpen size={16} />View All Bookings
        </Link>
        <Link to="/" className="btn-primary py-3 px-6 text-sm font-bold gap-2">
          Book Another Trip
        </Link>
      </div>

    </div>
  );
};

const InfoBlock: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, value, highlight, children }) => (
  <div>
    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
      {icon}{label}
    </div>
    {children ?? (
      <p className={`text-sm font-semibold tabular-nums ${highlight ? 'text-brand-800 text-base' : 'text-slate-900'}`}>{value}</p>
    )}
  </div>
);

export default BookingConfirmationPage;
