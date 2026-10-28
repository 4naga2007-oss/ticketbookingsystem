import React, { useEffect, useRef } from 'react';
import { X, Clock, ChevronRight } from 'lucide-react';
import type { ScheduleWithDetails } from '../../types/domain';
import { formatDate, formatTime, calcDuration, formatCurrency } from '../../utils/formatters';
import { VehicleTypeBadge } from '../common/UIComponents';

interface Props {
  trip: ScheduleWithDetails;
  onClose: () => void;
  onSelectSeats: () => void;
}

export const TripDetailsModal: React.FC<Props> = ({ trip, onClose, onSelectSeats }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const duration = calcDuration(trip.departureTime, trip.arrivalTime);
  const isSoldOut = trip.availableSeats === 0;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = closeRef.current?.closest<HTMLElement>('[role="dialog"]');
      if (!panel) return;
      const items = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-dialog-title"
        aria-describedby="trip-dialog-description"
        className="dialog-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <VehicleTypeBadge type={trip.vehicleType} />
              <span className="text-xs text-slate-500">Schedule #{trip.scheduleId}</span>
            </div>
            <h2 id="trip-dialog-title" className="text-xl font-semibold tracking-tight text-slate-900">{trip.vehicleNameOrType}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close trip details"
            className="btn-ghost -mr-2 -mt-1 p-2"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <div id="trip-dialog-description" className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-slate-50 p-4 sm:p-5">
            <div>
              <span className="text-xs font-medium text-slate-500">Departure</span>
              <p className="tabular-nums mt-1 text-2xl font-semibold text-slate-900">{formatTime(trip.departureTime)}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{trip.route.source}</p>
            </div>
            <div className="flex flex-col items-center gap-2 px-1 text-xs text-slate-500">
              <Clock size={15} aria-hidden="true" />
              <span className="whitespace-nowrap">{duration}</span>
              <span className="h-px w-12 bg-slate-300 sm:w-20" aria-hidden="true" />
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Arrival</span>
              <p className="tabular-nums mt-1 text-2xl font-semibold text-slate-900">{formatTime(trip.arrivalTime)}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{trip.route.destination}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <dt className="text-xs text-slate-500">Travel date</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(trip.journeyDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Distance</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{trip.route.distance > 0 ? `${trip.route.distance} km` : 'Direct route'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Available seats</dt>
              <dd className={`mt-1 text-sm font-semibold ${isSoldOut ? 'text-rose-700' : 'text-slate-900'}`}>
                {trip.availableSeats} of {trip.totalSeats}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Fare per seat</dt>
              <dd className="tabular-nums mt-1 text-sm font-semibold text-slate-900">{formatCurrency(trip.fare)}</dd>
            </div>
          </dl>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <span className="text-xs text-slate-500">Base fare</span>
            <p className="tabular-nums mt-0.5 text-xl font-semibold text-slate-900">{formatCurrency(trip.fare)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">Close</button>
            <button type="button" onClick={onSelectSeats} disabled={isSoldOut} className="btn-primary flex-1 sm:flex-none">
              {isSoldOut ? 'Sold out' : 'Choose seats'} <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default TripDetailsModal;
