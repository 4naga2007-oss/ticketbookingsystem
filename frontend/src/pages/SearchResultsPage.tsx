import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Clock,
  Users, ArrowRight, ChevronDown, Filter, Sparkles
} from 'lucide-react';
import { reservationApi } from '../services/reservationApi';
import type { ScheduleWithDetails } from '../types/domain';
import { formatDate, formatTime, calcDuration, formatCurrency } from '../utils/formatters';
import { SkeletonCard, EmptyState, ErrorState, VehicleTypeBadge } from '../components/common/UIComponents';
import { TripDetailsModal } from '../components/booking/TripDetailsModal';
import { ALL_STATIONS } from './HomePage';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const getParam = (key: string, def = '') => searchParams.get(key) ?? def;

  const [form, setForm] = useState({
    source: getParam('source'),
    destination: getParam('destination'),
    journeyDate: getParam('journeyDate', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
    vehicleType: (getParam('vehicleType', 'All')) as 'All' | 'Train' | 'Bus',
  });

  const [results, setResults] = useState<ScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'departure' | 'fare'>('departure');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ScheduleWithDetails | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (src: string, dst: string, date: string, type: 'All' | 'Train' | 'Bus') => {
    if (!src.trim() || !dst.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await reservationApi.search({ source: src, destination: dst, journeyDate: date, vehicleType: type });
      setResults(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to search trips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const src = getParam('source');
    const dst = getParam('destination');
    const date = getParam('journeyDate', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    const type = getParam('vehicleType', 'All') as 'All' | 'Train' | 'Bus';
    if (src && dst) doSearch(src, dst, date, type);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      source: form.source, destination: form.destination,
      journeyDate: form.journeyDate, vehicleType: form.vehicleType,
    });
    setSearchParams(params);
    doSearch(form.source, form.destination, form.journeyDate, form.vehicleType);
  };

  const filtered = results.filter(trip => {
    if (onlyAvailable && trip.availableSeats === 0) return false;
    if (form.vehicleType !== 'All' && trip.vehicleType !== form.vehicleType) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'fare') return a.fare - b.fare;
    return a.departureTime.localeCompare(b.departureTime);
  });

  return (
    <div className="space-y-6 page-enter pb-16">

      {/* Station datalist shared with home page */}
      <datalist id="stations-list-search">
        {ALL_STATIONS.map(s => <option key={s} value={s} />)}
      </datalist>

      {/* ─── Search Bar ────────────────────────────────────────────── */}
      <div className="search-panel card-slate p-5 sm:p-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-1">
              <label className="input-label" htmlFor="search-source">From</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-source" type="text" list="stations-list-search"
                  value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Source" className="input-field pl-10 font-semibold" required
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <label className="input-label" htmlFor="search-destination">To</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-destination" type="text" list="stations-list-search"
                  value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Destination" className="input-field pl-10 font-semibold" required
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <label className="input-label" htmlFor="search-date">Travel date</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-date" type="date" value={form.journeyDate}
                  onChange={e => setForm(f => ({ ...f, journeyDate: e.target.value }))}
                  className="input-field pl-10 font-semibold"
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <label className="input-label" htmlFor="search-vehicle">Vehicle type</label>
              <div className="relative">
                <select
                  id="search-vehicle" value={form.vehicleType}
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as 'All' | 'Train' | 'Bus' }))}
                  className="input-field appearance-none pr-9 font-semibold"
                >
                  <option value="All">All Transports</option>
                  <option value="Train">Train Only</option>
                  <option value="Bus">Bus Only</option>
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <button type="submit" className="btn-primary w-full py-3 text-sm font-bold gap-2 shadow-brand">
                <Search size={16} />Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Main Content (Sidebar + Results) ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Sidebar Filters */}
        <div className="search-filters lg:col-span-1 card-slate p-4 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <Filter size={16} className="text-brand-600" />
              Trip Filters
            </span>
          </div>

          {/* Filter Transport */}
          <div>
            <p className="input-label" id="search-transport-label">Transport mode</p>
            <div className="mt-1 flex flex-col gap-1.5" role="group" aria-labelledby="search-transport-label">
              {(['All', 'Train', 'Bus'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={form.vehicleType === type}
                  onClick={() => setForm(f => ({ ...f, vehicleType: type }))}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    form.vehicleType === type
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  <span>{type === 'All' ? 'All transport' : type === 'Bus' ? 'Buses' : 'Trains'}</span>
                  {form.vehicleType === type && <Sparkles size={12} className="text-brand-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div>
            <label className="input-label" htmlFor="sort-results">Sort results by</label>
            <select
              id="sort-results"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'departure' | 'fare')}
              className="input-field text-xs font-semibold py-2.5"
            >
              <option value="departure">Departure Time (Earliest)</option>
              <option value="fare">Ticket Price (Lowest First)</option>
            </select>
          </div>

          {/* Only Available Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={e => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              Show Only Available Seats
            </label>
          </div>

          {/* Quick city helper */}
          <div className="pt-2 border-t border-slate-100">
            <p className="input-label mb-2">Popular cities</p>
            <div className="flex flex-wrap gap-1.5">
              {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kochi', 'Kolkata', 'Coimbatore', 'Madurai'].map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    if (!form.source) setForm(f => ({ ...f, source: city }));
                    else if (!form.destination) setForm(f => ({ ...f, destination: city }));
                  }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors border border-slate-200"
                >
                  {city}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Click to fill From / To fields</p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-3 space-y-4">

          {/* Header Bar */}
          {searched && !loading && !error && (
            <div className="flex items-center justify-between px-1">
              <p className="text-slate-600 text-sm font-medium" aria-live="polite">
                {sorted.length > 0 ? (
                  <>Showing <span className="font-extrabold text-slate-900">{sorted.length}</span> trips for <span className="font-bold text-brand-600">{form.source} → {form.destination}</span> on <span className="font-bold text-slate-800">{formatDate(form.journeyDate)}</span></>
                ) : 'No trips match your criteria'}
              </p>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonCard key={i} lines={5} />)}
            </div>
          )}

          {/* Error State */}
          {error && <ErrorState message={error} onRetry={() => doSearch(form.source, form.destination, form.journeyDate, form.vehicleType)} />}

          {/* Empty State */}
          {!loading && !error && searched && sorted.length === 0 && (
            <EmptyState
              icon={<Search size={48} className="text-slate-400" />}
              title="No Trips Available"
              description={`No ${form.vehicleType !== 'All' ? form.vehicleType.toLowerCase() + ' ' : ''}trips found from ${form.source} to ${form.destination} on ${formatDate(form.journeyDate)}.`}
              action={
                <div className="flex flex-col items-center gap-2">
                  <Link to="/" className="btn-secondary text-sm">Search Different Route</Link>
                  <p className="text-xs text-slate-500">Try dates within the next 5 days — schedules are available from tomorrow onwards.</p>
                </div>
              }
            />
          )}

          {/* Results List */}
          {!loading && !error && sorted.length > 0 && (
            <div className="space-y-4">
              {sorted.map(trip => (
                <TripCard
                  key={trip.scheduleId}
                  trip={trip}
                  onViewDetails={() => setSelectedTrip(trip)}
                  onSelectSeats={() => navigate(`/seats/${trip.scheduleId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onSelectSeats={() => {
            setSelectedTrip(null);
            navigate(`/seats/${selectedTrip.scheduleId}`);
          }}
        />
      )}
    </div>
  );
};

// ─── Trip Card Component ──────────────────────────────────────────────────────

interface TripCardProps {
  trip: ScheduleWithDetails;
  onViewDetails: () => void;
  onSelectSeats: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onViewDetails, onSelectSeats }) => {
  const duration = calcDuration(trip.departureTime, trip.arrivalTime);
  const availability = trip.availableSeats;
  const isLow = availability > 0 && availability <= 5;
  const isSoldOut = availability === 0;

  return (
    <article className="trip-result card-hover p-5 sm:p-6">

      {/* Vehicle Info */}
      <div className="flex-shrink-0 w-full sm:w-36">
        <VehicleTypeBadge type={trip.vehicleType} />
        <p className="text-sm font-bold text-slate-900 mt-2 truncate">
          {trip.vehicleNameOrType}
        </p>
        <span className="text-xs font-semibold text-slate-500">
          ID #{trip.trainId ? `T-${trip.trainId}` : `B-${trip.busId}`}
        </span>
      </div>

      {/* Journey Timeline */}
      <div className="flex-1 w-full flex items-center justify-between gap-4">
        {/* Departure */}
        <div className="text-left">
          <p className="tabular-nums text-2xl font-semibold tracking-tight text-slate-900">{formatTime(trip.departureTime)}</p>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{trip.route.source}</p>
        </div>

        {/* Duration bar */}
        <div className="flex flex-col items-center flex-1 max-w-[160px] px-2">
          <span className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Clock size={11} /> {duration}
          </span>
          <div className="w-full flex items-center gap-1">
            <div className="h-0.5 flex-1 bg-slate-200 rounded-full" />
            <ArrowRight size={14} className="text-brand-600 flex-shrink-0" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">Direct Journey</span>
        </div>

        {/* Arrival */}
        <div className="text-right">
          <p className="tabular-nums text-2xl font-semibold tracking-tight text-slate-900">{formatTime(trip.arrivalTime)}</p>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{trip.route.destination}</p>
        </div>
      </div>

      {/* Seats & Price Column */}
      <div className="flex-shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 gap-3">
        <div className="text-left sm:text-right">
          <div className="flex items-center gap-1.5 sm:justify-end">
            <Users size={14} className="text-slate-400" />
            <span className={`text-xs font-extrabold ${isSoldOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
              {isSoldOut ? 'SOLD OUT' : `${availability} Seats Available`}
            </span>
          </div>
          <div className="mt-1">
            <span className="tabular-nums text-2xl font-semibold text-slate-900">{formatCurrency(trip.fare)}</span>
            <span className="text-[11px] text-slate-500 font-semibold"> / seat</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <button onClick={onViewDetails} className="btn-secondary text-xs py-2 px-3 font-bold">
            Details
          </button>
          <button
            onClick={onSelectSeats}
            disabled={isSoldOut}
            className="btn-primary text-xs py-2 px-4 font-bold shadow-brand"
          >
            Select Seats
          </button>
        </div>
      </div>

    </article>
  );
};

export default SearchResultsPage;
