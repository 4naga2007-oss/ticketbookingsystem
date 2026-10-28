import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, Smartphone, ShieldCheck, Lock, AlertCircle
} from 'lucide-react';
import { reservationApi } from '../services/reservationApi';
import { paymentApi } from '../services/paymentApi';
import type { Booking, ScheduleWithDetails } from '../types/domain';
import { formatCurrency, formatCardNumber, formatExpiry, formatDate, maskCardNumber } from '../utils/formatters';
import { Spinner, ErrorState } from '../components/common/UIComponents';
import toast from 'react-hot-toast';

type PaymentMethod = 'CARD' | 'UPI';

const UPI_PROVIDERS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Other'];

export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<ScheduleWithDetails | null>(null);
  const [tripError, setTripError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [processing, setProcessing] = useState(false);

  const [card, setCard] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardType: 'Visa',
    bankName: '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const [upi, setUpi] = useState({ upiId: '', provider: 'Google Pay' });
  const [upiErrors, setUpiErrors] = useState<Record<string, string>>({});

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await reservationApi.getBooking(Number(bookingId));
      setBooking(res.data);
      try {
        const tripRes = await reservationApi.getTripDetails(res.data.scheduleId);
        setTrip(tripRes.data);
        setTripError('');
      } catch (tripLoadError: unknown) {
        setTripError((tripLoadError as { message?: string })?.message ?? 'Trip details are unavailable.');
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const calculatedPassengerFares = booking?.passengerDetails.reduce((sum, p) => sum + (p.fare || 0), 0) ?? 0;
  const totalAmount = calculatedPassengerFares > 0
    ? calculatedPassengerFares
    : (trip?.fare ?? 0) * (booking?.passengerDetails.length ?? 1);

  const validateCard = (): boolean => {
    const errs: Record<string, string> = {};
    if (!card.cardHolderName.trim()) errs.cardHolderName = 'Cardholder name required';
    const rawNum = card.cardNumber.replace(/\s/g, '');
    if (!rawNum || rawNum.length < 13 || rawNum.length > 19) errs.cardNumber = 'Enter a valid card number';
    if (!card.expiry || card.expiry.length < 5) errs.expiry = 'Enter expiry as MM/YY';
    else {
      const [m, y] = card.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + y, m - 1);
      if (isNaN(m) || m < 1 || m > 12) errs.expiry = 'Invalid month';
      else if (expDate < new Date(now.getFullYear(), now.getMonth())) errs.expiry = 'Card has expired';
    }
    if (!card.cvv || card.cvv.length < 3) errs.cvv = 'Enter 3-4 digit CVV';
    if (!card.bankName.trim()) errs.bankName = 'Bank name required';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateUPI = (): boolean => {
    const errs: Record<string, string> = {};
    if (!upi.upiId.trim()) errs.upiId = 'UPI ID required';
    else if (!/^[\w.\-]+@[\w]+$/.test(upi.upiId)) errs.upiId = 'Enter a valid UPI ID (e.g. user@okicici)';
    setUpiErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCardChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cardNumber') formatted = formatCardNumber(value);
    if (field === 'expiry') formatted = formatExpiry(value);
    if (field === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4);
    setCard(c => ({ ...c, [field]: formatted }));
    setCardErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !bookingId) return;

    if (method === 'CARD' && !validateCard()) return;
    if (method === 'UPI' && !validateUPI()) return;

    setProcessing(true);
    try {
      if (method === 'CARD') {
        const rawNum = card.cardNumber.replace(/\s/g, '');
        await paymentApi.processCard({
          bookingId: Number(bookingId),
          amount: totalAmount,
          cardNumber: rawNum,
          cardType: card.cardType,
          bankName: card.bankName,
          expiry: card.expiry,
          cardHolderName: card.cardHolderName,
        });
      } else {
        await paymentApi.processUPI({
          bookingId: Number(bookingId),
          amount: totalAmount,
          upiId: upi.upiId,
          provider: upi.provider,
        });
      }
      toast.success('Payment successful! Booking confirmed.');
      navigate(`/booking-confirmation/${bookingId}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setProcessing(false);
      setCard(c => ({ ...c, cardNumber: '', cvv: '' }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchBooking} />;
  if (!booking) return null;

  return (
    <div className="page-enter max-w-5xl mx-auto pb-16 space-y-6">
      
      {/* Header */}
      <div className="card-slate p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-800">Checkout</span>
              <span className="text-slate-300">•</span>
              <span className="badge badge-initiated">{booking.bookingStatus}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-1">Complete payment</h1>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-medium text-slate-500 block">Amount due</span>
            <span className="tabular-nums text-2xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Payment Form Column */}
        <form onSubmit={handleSubmit} aria-busy={processing} className="lg:col-span-3 space-y-5">
          
          {/* Payment Method Selector */}
          <div className="card-slate p-5">
            <span className="mb-3 block text-sm font-semibold text-slate-800" id="payment-method-label">Payment method</span>
            <div className="grid grid-cols-2 gap-3">
              {(['CARD', 'UPI'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border text-sm font-bold transition-all ${
                    method === m
                      ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-brand ring-2 ring-brand-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m === 'CARD' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                  {m === 'CARD' ? 'Credit / Debit Card' : 'UPI Payment'}
                </button>
              ))}
            </div>
          </div>

          {/* Card Form */}
          {method === 'CARD' && (
            <div className="card-slate space-y-4 p-5 sm:p-6">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-600" />
                Enter Card Details
              </h3>

              <div>
                <label className="input-label" htmlFor="card-holder">Cardholder name</label>
                <input
                  type="text"
                  id="card-holder"
                  value={card.cardHolderName}
                  onChange={e => handleCardChange('cardHolderName', e.target.value)}
                  placeholder="Full name as printed on card"
                  className={`input-field font-semibold ${cardErrors.cardHolderName ? 'border-rose-500' : ''}`}
                  autoComplete="cc-name"
                />
                {cardErrors.cardHolderName && <p className="text-xs text-rose-600 font-bold mt-1">{cardErrors.cardHolderName}</p>}
              </div>

              <div>
                <label className="input-label" htmlFor="card-number">Card number</label>
                <input
                  type="text"
                  id="card-number"
                  value={card.cardNumber}
                  onChange={e => handleCardChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`input-field font-mono font-bold tracking-wider ${cardErrors.cardNumber ? 'border-rose-500' : ''}`}
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                {cardErrors.cardNumber && <p className="text-xs text-rose-600 font-bold mt-1">{cardErrors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="input-label" htmlFor="card-expiry">Expiry date</label>
                  <input
                    type="text"
                    id="card-expiry"
                    value={card.expiry}
                    onChange={e => handleCardChange('expiry', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`input-field font-mono font-bold ${cardErrors.expiry ? 'border-rose-500' : ''}`}
                    autoComplete="cc-exp"
                    inputMode="numeric"
                  />
                  {cardErrors.expiry && <p className="text-xs text-rose-600 font-bold mt-1">{cardErrors.expiry}</p>}
                </div>
                <div>
                  <label className="input-label" htmlFor="card-cvv">CVV code</label>
                  <input
                    type="password"
                    id="card-cvv"
                    value={card.cvv}
                    onChange={e => handleCardChange('cvv', e.target.value)}
                    placeholder="•••"
                    maxLength={4}
                    className={`input-field font-mono font-bold ${cardErrors.cvv ? 'border-rose-500' : ''}`}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                  />
                  {cardErrors.cvv && <p className="text-xs text-rose-600 font-bold mt-1">{cardErrors.cvv}</p>}
                </div>
                <div>
                  <label className="input-label" htmlFor="card-network">Network</label>
                  <select
                    id="card-network"
                    value={card.cardType}
                    onChange={e => setCard(c => ({ ...c, cardType: e.target.value }))}
                    className="input-field font-semibold"
                  >
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>RuPay</option>
                    <option>Amex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="card-bank">Issuing bank</label>
                <input
                  type="text"
                  id="card-bank"
                  value={card.bankName}
                  onChange={e => handleCardChange('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
                  className={`input-field font-semibold ${cardErrors.bankName ? 'border-rose-500' : ''}`}
                />
                {cardErrors.bankName && <p className="text-xs text-rose-600 font-bold mt-1">{cardErrors.bankName}</p>}
              </div>

              {card.cardNumber.length >= 4 && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  Card Masking Preview: <span className="font-mono font-bold text-slate-900">{maskCardNumber(card.cardNumber.replace(/\s/g,''))}</span> ({card.cardType})
                </div>
              )}
            </div>
          )}

          {/* UPI Form */}
          {method === 'UPI' && (
            <div className="card-slate space-y-4 p-5 sm:p-6">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <Smartphone size={18} className="text-brand-600" />
                Enter Virtual Payment Address (VPA)
              </h3>
              <div>
                <label className="input-label" htmlFor="upi-id">UPI ID</label>
                <input
                  type="text"
                  id="upi-id"
                  value={upi.upiId}
                  onChange={e => { setUpi(u => ({ ...u, upiId: e.target.value })); setUpiErrors({}); }}
                  placeholder="username@bank (e.g. alice@okicici)"
                  className={`input-field font-semibold ${upiErrors.upiId ? 'border-rose-500' : ''}`}
                  autoComplete="off"
                />
                {upiErrors.upiId && <p className="text-xs text-rose-600 font-bold mt-1">{upiErrors.upiId}</p>}
              </div>
              <div>
                <label className="input-label" htmlFor="upi-provider">UPI app provider</label>
                <select
                  id="upi-provider"
                  value={upi.provider}
                  onChange={e => setUpi(u => ({ ...u, provider: e.target.value }))}
                  className="input-field font-semibold"
                >
                  {UPI_PROVIDERS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Trust Banner */}
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0" />
            <p className="text-sm leading-6 text-emerald-900">
              Full card numbers are not stored in the booking record.
            </p>
          </div>

          <button type="submit" disabled={processing} className="btn-primary w-full py-3.5 text-base">
            {processing ? <Spinner size="sm" /> : <><Lock size={17} aria-hidden="true" />Pay {formatCurrency(totalAmount)}</>}
          </button>
        </form>

        {/* Booking Summary Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-slate space-y-4 p-5 sm:p-6 lg:sticky lg:top-20">
            <h3 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Booking summary</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">
                {trip ? `${trip.route.source} to ${trip.route.destination}` : `Booking #${booking.bookingId}`}
              </p>
              {trip && <p className="text-slate-600">{formatDate(trip.journeyDate)} · {trip.vehicleNameOrType}</p>}
              {tripError && <p className="text-xs text-amber-800">{tripError}</p>}
            </div>

            <div className="space-y-3">
              {booking.passengerDetails.map((pd, i) => (
                <div key={i} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 text-sm">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{pd.passengerName}</p>
                    <p className="text-slate-500 font-semibold">Seat {pd.seatNumber} • Age {pd.passengerAge} ({pd.passengerGender})</p>
                  </div>
                  <span className="font-black text-slate-900 text-sm">{formatCurrency(pd.fare)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total</span>
              <span className="tabular-nums text-2xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle size={14} /> Temporary Seat Hold Active
              </div>
              <p>Complete this transaction now to prevent automatic expiration.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
