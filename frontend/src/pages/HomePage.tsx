import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Bus, Calendar, MapPin, Search, ShieldCheck, TicketCheck, Train } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// All seeded cities / stations for autocomplete
export const ALL_STATIONS = [
  // Tamil Nadu
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Vellore',
  // Karnataka
  'Bengaluru', 'Mysuru',
  // Maharashtra
  'Mumbai', 'Pune', 'Nashik',
  // Delhi / North
  'Delhi', 'Agra', 'Jaipur', 'Chandigarh',
  // Andhra / Telangana
  'Hyderabad', 'Vijayawada',
  // Kerala
  'Kochi', 'Thiruvananthapuram',
  // East India
  'Kolkata', 'Bhubaneswar',
];

const POPULAR_ROUTES = [
  { source: 'Chennai',    destination: 'Bengaluru' },
  { source: 'Chennai',    destination: 'Coimbatore' },
  { source: 'Bengaluru',  destination: 'Chennai' },
  { source: 'Mumbai',     destination: 'Pune' },
  { source: 'Delhi',      destination: 'Agra' },
  { source: 'Hyderabad',  destination: 'Vijayawada' },
  { source: 'Bengaluru',  destination: 'Mysuru' },
  { source: 'Chennai',    destination: 'Madurai' },
  { source: 'Kochi',      destination: 'Thiruvananthapuram' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    source: '',
    destination: '',
    journeyDate: tomorrow,
    vehicleType: 'All' as 'All' | 'Train' | 'Bus',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      source: form.source.trim(),
      destination: form.destination.trim(),
      journeyDate: form.journeyDate,
      vehicleType: form.vehicleType,
    });
    navigate(`/search?${params.toString()}`);
  };

  const handlePopularRoute = (source: string, destination: string) => {
    const params = new URLSearchParams({ source, destination, journeyDate: tomorrow, vehicleType: 'All' });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="page-enter space-y-14 pb-12">
      <section className="grid items-center gap-8 py-5 md:py-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div className="max-w-xl">
          <span className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-800">
            <TicketCheck size={17} aria-hidden="true" />
            Train and bus reservations
          </span>
          <h1 className="max-w-[12ch] text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl">
            Plan the journey. We'll handle the details.
          </h1>
          <p className="mt-5 max-w-[45ch] text-base leading-7 text-slate-600">
            Compare departures, choose your seats, and keep every booking in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-brand-700" aria-hidden="true" />A clear, secure checkout</span>
            <span className="inline-flex items-center gap-2"><TicketCheck size={17} className="text-brand-700" aria-hidden="true" />Your ticket after payment</span>
          </div>
        </div>

        <form onSubmit={handleSearch} id="search-form" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Find a trip</h2>
            <div className="flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Transport type">
              {(['All', 'Train', 'Bus'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={form.vehicleType === type}
                  onClick={() => setForm(f => ({ ...f, vehicleType: type }))}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                    form.vehicleType === type ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'Train' && <Train size={14} aria-hidden="true" />}
                  {type === 'Bus' && <Bus size={14} aria-hidden="true" />}
                  {type === 'All' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Station datalist */}
          <datalist id="stations-list">
            {ALL_STATIONS.map(s => <option key={s} value={s} />)}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="input-label" htmlFor="home-source">From</label>
              <div className="relative">
                <MapPin size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="home-source"
                  type="text"
                  list="stations-list"
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="City or station"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label" htmlFor="home-destination">To</label>
              <div className="relative">
                <MapPin size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="home-destination"
                  type="text"
                  list="stations-list"
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Where to?"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="input-label" htmlFor="home-date">Travel date</label>
              <div className="relative">
                <Calendar size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="home-date"
                  type="date"
                  value={form.journeyDate}
                  min={today}
                  onChange={e => setForm(f => ({ ...f, journeyDate: e.target.value }))}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary mt-5 w-full py-3 text-sm">
            <Search size={17} aria-hidden="true" />
            Search trips
          </button>
        </form>
      </section>

      <section aria-labelledby="popular-routes-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="popular-routes-title" className="text-2xl font-semibold tracking-tight text-slate-900">Popular routes</h2>
            <p className="mt-1 text-sm text-slate-600">Start with a commonly searched journey.</p>
          </div>
          <Link to="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-brand-900">
            Browse all trips <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
          {POPULAR_ROUTES.map(({ source, destination }) => (
            <button
              key={`${source}-${destination}`}
              onClick={() => handlePopularRoute(source, destination)}
              className="flex min-h-14 items-center justify-between border-b border-slate-200 py-3 text-left text-sm font-medium text-slate-800 transition-colors hover:text-brand-800"
            >
              <span>
                {source}<span className="mx-2 text-slate-400" aria-hidden="true">to</span>{destination}
              </span>
              <ArrowRight size={15} aria-hidden="true" className="text-slate-500" />
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5 border-y border-slate-200 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <ShieldCheck size={21} className="mt-0.5 shrink-0 text-brand-800" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-slate-900">A straightforward way to travel</h2>
            <p className="mt-1 max-w-[60ch] text-sm leading-6 text-slate-600">
              See available seats before you reserve. Complete payment to confirm your booking and receive its ticket.
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <Link to="/register" className="btn-outline shrink-0">
            Create an account <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </section>
    </div>
  );
};

export default HomePage;
