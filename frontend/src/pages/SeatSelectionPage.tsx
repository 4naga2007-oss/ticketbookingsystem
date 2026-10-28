import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Train, Bus, Users, CheckCircle2, AlertCircle, Trash2, ArrowRight, Plus, Sparkles, Shuffle } from 'lucide-react';
import { reservationApi } from '../services/reservationApi';
import type { SeatAvailability, PassengerDetail } from '../types/domain';
import { formatCurrency } from '../utils/formatters';
import { Spinner, ErrorState, ConfirmDialog } from '../components/common/UIComponents';
import toast from 'react-hot-toast';

type Gender = 'Male' | 'Female' | 'Other';
type BerthPreference = 'No Preference' | 'Lower Berth' | 'Middle Berth' | 'Upper Berth' | 'Side Lower' | 'Side Upper';

interface LocalPassenger {
  id: string;
  seatNumber: string;
  passengerName: string;
  passengerAge: string;
  passengerGender: Gender;
  berthPreference?: BerthPreference;
  fare: number;
}

export const SeatSelectionPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();

  const [availability, setAvailability] = useState<SeatAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<LocalPassenger[]>([]);
  const [reserving, setReserving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAvailability = useCallback(async () => {
    if (!scheduleId) return;
    setLoading(true);
    setError('');
    try {
      const res = await reservationApi.getSeatAvailability(Number(scheduleId));
      setAvailability(res.data);
      // For Train, initialize with 1 IRCTC passenger slot by default
      if (res.data.vehicleType === 'Train') {
        setPassengers([
          {
            id: `p-${Date.now()}`,
            seatNumber: 'AUTO',
            passengerName: '',
            passengerAge: '',
            passengerGender: 'Male',
            berthPreference: 'No Preference',
            fare: res.data.fare ?? 0,
          },
        ]);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load seat availability.');
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // BUS INTERACTIVE SEAT TOGGLE
  const toggleSeat = (seat: string) => {
    if (!availability) return;
    if (availability.occupiedSeats.includes(seat)) return;

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(prev => prev.filter(s => s !== seat));
      setPassengers(prev => prev.filter(p => p.seatNumber !== seat));
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`${seat}_passengerName`];
        delete next[`${seat}_passengerAge`];
        return next;
      });
    } else {
      const newPassenger: LocalPassenger = {
        id: `${seat}-${Date.now()}`,
        seatNumber: seat,
        passengerName: '',
        passengerAge: '',
        passengerGender: 'Male',
        fare: availability.fare ?? 0,
      };
      setSelectedSeats(prev => [...prev, seat]);
      setPassengers(prev => [...prev, newPassenger]);
    }
  };

  // IRCTC TRAIN ADD/REMOVE PASSENGERS
  const addTrainPassenger = () => {
    if (!availability) return;
    if (passengers.length >= 6) {
      toast.error('IRCTC allows maximum 6 passengers per booking');
      return;
    }
    if (passengers.length >= availability.availableSeats) {
      toast.error(`Only ${availability.availableSeats} seats remaining.`);
      return;
    }
    const newPassenger: LocalPassenger = {
      id: `p-${Date.now()}-${passengers.length}`,
      seatNumber: 'AUTO',
      passengerName: '',
      passengerAge: '',
      passengerGender: 'Male',
      berthPreference: 'No Preference',
      fare: availability.fare ?? 0,
    };
    setPassengers(prev => [...prev, newPassenger]);
  };

  const removeTrainPassenger = (id: string) => {
    if (passengers.length <= 1) {
      toast.error('At least 1 passenger is required');
      return;
    }
    setPassengers(prev => prev.filter(p => p.id !== id));
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[`${id}_passengerName`];
      delete next[`${id}_passengerAge`];
      return next;
    });
  };

  const updatePassengerById = (id: string, field: keyof LocalPassenger, value: any) => {
    setPassengers(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
    setFormErrors(prev => ({ ...prev, [`${id}_${field}`]: '' }));
  };

  const updatePassengerBySeat = (seat: string, field: keyof LocalPassenger, value: any) => {
    setPassengers(ps => ps.map(p => p.seatNumber === seat ? { ...p, [field]: value } : p));
    setFormErrors(prev => ({ ...prev, [`${seat}_${field}`]: '' }));
  };

  const validatePassengers = (): boolean => {
    const errors: Record<string, string> = {};
    const isTrain = availability?.vehicleType === 'Train';
    passengers.forEach(p => {
      const key = isTrain ? p.id : p.seatNumber;
      if (!p.passengerName.trim()) errors[`${key}_passengerName`] = 'Name required';
      const age = Number(p.passengerAge);
      if (!p.passengerAge || isNaN(age) || age < 1 || age > 120) errors[`${key}_passengerAge`] = 'Valid age required';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReserve = async () => {
    if (!validatePassengers()) {
      toast.error('Please fill in all passenger details');
      return;
    }
    setShowConfirm(true);
  };

  const confirmReserve = async () => {
    if (!scheduleId || !availability) return;
    setShowConfirm(false);
    setReserving(true);
    try {
      const isTrain = availability.vehicleType === 'Train';
      const payload: PassengerDetail[] = passengers.map(p => ({
        passengerName: p.passengerName,
        passengerAge: Number(p.passengerAge),
        passengerGender: p.passengerGender,
        seatNumber: isTrain ? 'AUTO' : p.seatNumber,
        fare: availability.fare || 0,
      }));
      const res = await reservationApi.reserve({ scheduleId: Number(scheduleId), passengerDetails: payload });
      toast.success(isTrain ? 'Tickets booked! Coach and seats alloted automatically.' : 'Seats reserved! Proceeding to payment.');
      navigate(`/payment/${res.data.bookingId}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Reservation failed.';
      toast.error(msg);
    } finally {
      setReserving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 font-semibold text-sm">Loading availability...</p>
    </div>
  );

  if (error) return <ErrorState message={error} onRetry={fetchAvailability} />;
  if (!availability) return null;

  const isTrain = availability.vehicleType === 'Train';
  const fare = availability.fare ?? 0;
  const passengerCount = isTrain ? passengers.length : selectedSeats.length;
  const total = passengerCount * fare;

  // BUS COACH LAYOUT SETUP
  const seatsPerRow = 4;
  const aisleIndex = 2;
  const busRows: string[][] = [];
  if (!isTrain) {
    for (let i = 0; i < availability.allSeats.length; i += seatsPerRow) {
      busRows.push(availability.allSeats.slice(i, i + seatsPerRow));
    }
  }

  return (
    <div className="page-enter max-w-6xl mx-auto pb-16 space-y-6">
      
      {/* Header Banner */}
      <div className="card-slate p-6 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {isTrain ? 'IRCTC Indian Railways Reservation' : 'Bus Coach Seat Selection (2+2 Aisle)'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500">Schedule #{availability.scheduleId}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              {isTrain ? <Train size={24} className="text-brand-700" /> : <Bus size={24} className="text-brand-700" />}
              {availability.vehicleNameOrType}
            </h1>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Available Inventory</span>
            <span className="text-lg font-black text-emerald-600">
              AVAILABLE - {availability.availableSeats} <span className="text-slate-400 font-normal">/ {availability.totalSeats} seats</span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TRAIN: IRCTC SYSTEM (AUTOMATIC RANDOM SEAT ALLOTMENT) */}
      {/* ======================================================== */}
      {isTrain ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* IRCTC Passenger Information Form Column */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* IRCTC Notice Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
              <Shuffle className="text-blue-700 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-extrabold text-blue-900">IRCTC Computerized Seat Allotment</h3>
                <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                  As per Indian Railways (IRCTC) reservation guidelines, coach and seat numbers (e.g. Lower, Middle, Upper, Window) are automatically allocated by the reservation algorithm based on availability and berth preference upon booking confirmation.
                </p>
              </div>
            </div>

            {/* Passenger Forms */}
            <div className="space-y-4">
              {passengers.map((p, idx) => (
                <div key={p.id} className="card-slate p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-brand-800 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900">Passenger {idx + 1}</h4>
                    </div>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTrainPassenger(p.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Passenger"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label" htmlFor={`p-${p.id}-name`}>Full Name (as per Govt ID)</label>
                      <input
                        type="text"
                        id={`p-${p.id}-name`}
                        value={p.passengerName}
                        onChange={e => updatePassengerById(p.id, 'passengerName', e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className={`input-field font-semibold ${formErrors[`${p.id}_passengerName`] ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                      />
                      {formErrors[`${p.id}_passengerName`] && (
                        <p className="text-xs text-rose-600 font-bold mt-1">{formErrors[`${p.id}_passengerName`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="input-label" htmlFor={`p-${p.id}-age`}>Age</label>
                        <input
                          type="number"
                          id={`p-${p.id}-age`}
                          value={p.passengerAge}
                          onChange={e => updatePassengerById(p.id, 'passengerAge', e.target.value)}
                          placeholder="Age"
                          min={1} max={120}
                          className={`input-field font-semibold ${formErrors[`${p.id}_passengerAge`] ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                        />
                        {formErrors[`${p.id}_passengerAge`] && (
                          <p className="text-xs text-rose-600 font-bold mt-1">{formErrors[`${p.id}_passengerAge`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="input-label" htmlFor={`p-${p.id}-gender`}>Gender</label>
                        <select
                          id={`p-${p.id}-gender`}
                          value={p.passengerGender}
                          onChange={e => updatePassengerById(p.id, 'passengerGender', e.target.value as Gender)}
                          className="input-field font-semibold"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label" htmlFor={`p-${p.id}-berth`}>Berth Preference (IRCTC)</label>
                    <select
                      id={`p-${p.id}-berth`}
                      value={p.berthPreference}
                      onChange={e => updatePassengerById(p.id, 'berthPreference', e.target.value as BerthPreference)}
                      className="input-field font-semibold"
                    >
                      <option value="No Preference">No Preference</option>
                      <option value="Lower Berth">Lower Berth</option>
                      <option value="Middle Berth">Middle Berth</option>
                      <option value="Upper Berth">Upper Berth</option>
                      <option value="Side Lower">Side Lower</option>
                      <option value="Side Upper">Side Upper</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Berth allocation is subject to availability by IRCTC reservation algorithm.</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Passenger Button */}
            {passengers.length < 6 && (
              <button
                type="button"
                onClick={addTrainPassenger}
                className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-bold text-slate-700 hover:border-brand-600 hover:text-brand-700 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Passenger ({passengers.length}/6)
              </button>
            )}

          </div>

          {/* IRCTC Summary Column */}
          <div className="space-y-5">
            <div className="card-slate p-6 bg-white border border-slate-200">
              <h3 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users size={18} className="text-brand-600" />
                  Fare Summary
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md border border-brand-200">
                  {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
                </span>
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Base Fare ({passengers.length} × {formatCurrency(fare)})</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Reservation Fee</span>
                    <span className="text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>IRCTC Convenience Fee</span>
                    <span className="text-emerald-600">₹0</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Amount</span>
                    <span className="text-[11px] text-slate-400 font-semibold">Payable at checkout</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving || passengers.some(p => !p.passengerName.trim() || !p.passengerAge)}
                  className="btn-primary w-full py-4 text-base font-bold shadow-brand-lg gap-2"
                >
                  {reserving ? <Spinner size="sm" /> : <>BOOK TICKET ({formatCurrency(total)}) <ArrowRight size={18} /></>}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Sparkles size={14} className="text-brand-600" />
                  <span>Coach & Seat alloted automatically</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ======================================================== */
        /* 2. BUS: INTERACTIVE 2+2 SEAT SELECTION LAYOUT            */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Bus Coach Seat Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-slate p-5 sm:p-6 bg-white border border-slate-200 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Seat Legend</span>
                <div className="flex items-center gap-4">
                  <Legend color="bg-white border-2 border-slate-300 text-slate-700" label="Available" />
                  <Legend color="bg-emerald-600 text-white font-bold" label="Selected" />
                  <Legend color="bg-slate-200 border border-slate-300 text-slate-400 line-through" label="Occupied" />
                </div>
              </div>

              {/* Coach Mockup */}
              <div className="max-w-md mx-auto bg-slate-100/70 border-2 border-slate-300 rounded-3xl p-5 shadow-inner">
                
                {/* Front Driver Cabin */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-2.5 mb-6 shadow-xs">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    🚍 Driver Cabin
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-400">Front</span>
                  </div>
                </div>

                {/* 2+2 Bus Rows */}
                <div className="space-y-3.5">
                  {busRows.map((rowSeats, rowIndex) => {
                    const leftSeats = rowSeats.slice(0, aisleIndex);
                    const rightSeats = rowSeats.slice(aisleIndex);

                    return (
                      <div key={rowIndex} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          {leftSeats.map(seat => {
                            const occupied = availability.occupiedSeats.includes(seat);
                            const chosen = selectedSeats.includes(seat);

                            return (
                              <button
                                key={seat}
                                type="button"
                                onClick={() => toggleSeat(seat)}
                                disabled={occupied}
                                aria-label={`Seat ${seat}, ${occupied ? 'occupied' : chosen ? 'selected' : 'available'}`}
                                aria-pressed={chosen}
                                title={occupied ? `Seat ${seat} (Occupied)` : `Seat ${seat}`}
                                className={`
                                  w-11 h-12 rounded-xl text-xs font-black transition-all duration-150 border flex flex-col items-center justify-center relative
                                  ${occupied
                                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed line-through'
                                    : chosen
                                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-md scale-105 ring-2 ring-emerald-300'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:text-emerald-700'
                                  }
                                `}
                              >
                                <span>{seat}</span>
                                {chosen && <CheckCircle2 size={11} className="text-white mt-0.5" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Central Walking Aisle */}
                        <div className="w-8 shrink-0 flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                          <span>R{rowIndex + 1}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-start">
                          {rightSeats.map(seat => {
                            const occupied = availability.occupiedSeats.includes(seat);
                            const chosen = selectedSeats.includes(seat);

                            return (
                              <button
                                key={seat}
                                type="button"
                                onClick={() => toggleSeat(seat)}
                                disabled={occupied}
                                aria-label={`Seat ${seat}, ${occupied ? 'occupied' : chosen ? 'selected' : 'available'}`}
                                aria-pressed={chosen}
                                title={occupied ? `Seat ${seat} (Occupied)` : `Seat ${seat}`}
                                className={`
                                  w-11 h-12 rounded-xl text-xs font-black transition-all duration-150 border flex flex-col items-center justify-center relative
                                  ${occupied
                                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed line-through'
                                    : chosen
                                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-md scale-105 ring-2 ring-emerald-300'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:text-emerald-700'
                                  }
                                `}
                              >
                                <span>{seat}</span>
                                {chosen && <CheckCircle2 size={11} className="text-white mt-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 text-center py-2 bg-slate-200/60 rounded-xl text-[11px] font-bold text-slate-500 uppercase tracking-widest border border-slate-300/60">
                  Rear Section
                </div>

              </div>
            </div>
          </div>

          {/* Bus Summary & Passenger Details Column */}
          <div className="space-y-5">
            <div className="card-slate p-6 bg-white border border-slate-200">
              <h3 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users size={18} className="text-brand-600" />
                  Booking Summary
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md border border-brand-200">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                </span>
              </h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500 text-sm font-semibold">Click seats in the coach layout to select</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                    {selectedSeats.map(s => (
                      <div key={s} className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Seat {s}</span>
                        <span className="text-slate-900">{formatCurrency(fare)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Amount</span>
                      <span className="text-[11px] text-slate-400 font-semibold">{selectedSeats.length} × {formatCurrency(fare)}</span>
                    </div>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bus Passenger Input Cards */}
            {passengers.map((p, idx) => (
              <div key={p.seatNumber} className="passenger-form card-slate p-5 space-y-3 relative border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 font-black text-xs border border-brand-200">
                      Seat {p.seatNumber}
                    </span>
                    <span>Passenger {idx + 1}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => toggleSeat(p.seatNumber)}
                    aria-label={`Remove seat ${p.seatNumber}`}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove seat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <label className="input-label" htmlFor={`bus-p-${p.seatNumber}-name`}>Full Name</label>
                  <input
                    type="text"
                    id={`bus-p-${p.seatNumber}-name`}
                    value={p.passengerName}
                    onChange={e => updatePassengerBySeat(p.seatNumber, 'passengerName', e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`input-field font-semibold ${formErrors[`${p.seatNumber}_passengerName`] ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                  />
                  {formErrors[`${p.seatNumber}_passengerName`] && (
                    <p className="text-xs text-rose-600 font-bold mt-1">{formErrors[`${p.seatNumber}_passengerName`]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label" htmlFor={`bus-p-${p.seatNumber}-age`}>Age</label>
                    <input
                      type="number"
                      id={`bus-p-${p.seatNumber}-age`}
                      value={p.passengerAge}
                      onChange={e => updatePassengerBySeat(p.seatNumber, 'passengerAge', e.target.value)}
                      placeholder="Age"
                      min={1} max={120}
                      className={`input-field font-semibold ${formErrors[`${p.seatNumber}_passengerAge`] ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                    />
                    {formErrors[`${p.seatNumber}_passengerAge`] && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{formErrors[`${p.seatNumber}_passengerAge`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label" htmlFor={`bus-p-${p.seatNumber}-gender`}>Gender</label>
                    <select
                      id={`bus-p-${p.seatNumber}-gender`}
                      value={p.passengerGender}
                      onChange={e => updatePassengerBySeat(p.seatNumber, 'passengerGender', e.target.value as Gender)}
                      className="input-field font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {selectedSeats.length > 0 && (
              <div className="seat-action space-y-3 pt-2">
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 font-semibold leading-snug">
                    Seats are held for 10 minutes upon reservation. Complete payment to finalize booking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving || passengers.some(p => !p.passengerName.trim() || !p.passengerAge)}
                  className="btn-primary w-full py-4 text-base font-bold shadow-brand-lg gap-2"
                >
                  {reserving ? <Spinner size="sm" /> : <>CONTINUE TO PAYMENT ({formatCurrency(total)}) <ArrowRight size={18} /></>}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title={isTrain ? 'Confirm Train Booking' : 'Confirm Seat Hold'}
        message={isTrain
          ? `Proceed to reserve tickets for ${passengers.length} passenger(s) for ${formatCurrency(total)}? Coach and seat numbers will be alloted automatically as per IRCTC reservation.`
          : `Lock ${selectedSeats.length} seat(s) (${selectedSeats.join(', ')}) for ${formatCurrency(total)}? You will have 10 minutes to complete payment.`
        }
        confirmLabel="Proceed to Payment"
        onConfirm={confirmReserve}
        onCancel={() => setShowConfirm(false)}
        variant="warning"
      />
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-4 h-4 rounded-md text-[10px] font-bold flex items-center justify-center ${color}`} />
    <span className="text-xs font-bold text-slate-700">{label}</span>
  </div>
);

export default SeatSelectionPage;
