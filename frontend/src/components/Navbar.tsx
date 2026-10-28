import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu, X, Ticket, User, LayoutDashboard,
  Calendar, BookOpen, Users, BarChart2, LogOut, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, isPassenger, user, passenger, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = passenger?.name ?? user?.userName ?? 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors duration-150 border-b-2 ${
      isActive
        ? 'text-brand-800 border-brand-700'
        : 'text-slate-600 border-transparent hover:text-slate-900'
    }`;

  const passengerLinks = [
    { to: '/home', label: 'Home', exact: true },
    { to: '/search', label: 'Search Trips' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/profile', label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/admin/schedules', label: 'Schedules', icon: <Calendar size={15} /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <BookOpen size={15} /> },
    { to: '/admin/users', label: 'Users', icon: <Users size={15} /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart2 size={15} /> },
  ];

  return (
    <nav className="site-nav sticky top-0 z-50 border-b border-slate-200 bg-white">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/home') : '/'} className="flex items-center gap-2.5 group" aria-label="TransitBook home">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center text-white transition-colors group-hover:bg-brand-900">
              <Ticket size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight group-hover:text-brand-600 transition-colors">
                Transit<span className="text-brand-600">Book</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500">Train and bus travel</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {!isAuthenticated && (
              <>
                <NavLink to="/login" className={navLinkClass}>Log in</NavLink>
                <NavLink to="/home" className={navLinkClass}>Search Trips</NavLink>
              </>
            )}
            {isPassenger && passengerLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/home'} className={navLinkClass}>{label}</NavLink>
            ))}
            {isAdmin && adminLinks.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end={to === '/admin'} className={navLinkClass}>
                {icon}{label}
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label={`Account menu for ${displayName}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 hover:bg-slate-100 transition-all shadow-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {getInitials(displayName)}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:block text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 font-semibold">
                      Admin
                    </span>
                  )}
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div id="account-menu" role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg p-1.5 shadow-modal z-20">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      {isPassenger && (
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition"
                        >
                          <User size={15} />Profile Settings
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition"
                      >
                        <LogOut size={15} />Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div id="mobile-navigation" className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1.5">
            {!isAuthenticated && (
              <>
                <MobileLink to="/" label="Home" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/search" label="Search Trips" onClick={() => setMobileOpen(false)} />
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="btn-secondary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-primary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>Register</Link>
                </div>
              </>
            )}
            {isPassenger && passengerLinks.map(({ to, label }) => (
              <MobileLink key={to} to={to} label={label} onClick={() => setMobileOpen(false)} />
            ))}
            {isAdmin && adminLinks.map(({ to, label }) => (
              <MobileLink key={to} to={to} label={label} onClick={() => setMobileOpen(false)} />
            ))}
            {isAuthenticated && (
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full text-left px-3 py-2.5 text-sm text-rose-600 font-semibold hover:bg-rose-50 rounded-xl transition"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const MobileLink: React.FC<{ to: string; label: string; onClick: () => void }> = ({ to, label, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-3.5 py-2.5 text-sm rounded-xl font-semibold transition ${
        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
      }`
    }
  >
    {label}
  </NavLink>
);

export default Navbar;
