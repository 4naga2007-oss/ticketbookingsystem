import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/Navbar';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  SearchResultsPage,
  SeatSelectionPage,
  PaymentPage,
  BookingConfirmationPage,
  MyBookingsPage,
  ProfilePage,
  AdminDashboardPage,
  AdminSchedulesPage,
  AdminBookingsPage,
  AdminUsersPage,
  AdminReportsPage,
} from './pages';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-shell flex flex-col font-sans">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#192a33',
                color: '#f7faf9',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              },
            }}
          />
          <Navbar />
          <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LoginPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Search (Accessible publicly or by passengers) */}
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Protected Passenger Routes */}
              <Route
                path="/seat-selection/:scheduleId"
                element={<ProtectedRoute requiredRole="PASSENGER"><SeatSelectionPage /></ProtectedRoute>}
              />
              <Route
                path="/seats/:scheduleId"
                element={<ProtectedRoute requiredRole="PASSENGER"><SeatSelectionPage /></ProtectedRoute>}
              />
              <Route
                path="/payment/:bookingId"
                element={<ProtectedRoute requiredRole="PASSENGER"><PaymentPage /></ProtectedRoute>}
              />
              <Route
                path="/checkout/:bookingId"
                element={<ProtectedRoute requiredRole="PASSENGER"><PaymentPage /></ProtectedRoute>}
              />
              <Route
                path="/booking-confirmation/:bookingId"
                element={<ProtectedRoute requiredRole="PASSENGER"><BookingConfirmationPage /></ProtectedRoute>}
              />
              <Route
                path="/confirmation/:bookingId"
                element={<ProtectedRoute requiredRole="PASSENGER"><BookingConfirmationPage /></ProtectedRoute>}
              />
              <Route
                path="/bookings"
                element={<ProtectedRoute requiredRole="PASSENGER"><MyBookingsPage /></ProtectedRoute>}
              />
              <Route
                path="/my-bookings"
                element={<ProtectedRoute requiredRole="PASSENGER"><MyBookingsPage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute requiredRole="PASSENGER"><ProfilePage /></ProtectedRoute>}
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/dashboard"
                element={<Navigate to="/admin" replace />}
              />
              <Route
                path="/admin/schedules"
                element={<ProtectedRoute requiredRole="ADMIN"><AdminSchedulesPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/bookings"
                element={<ProtectedRoute requiredRole="ADMIN"><AdminBookingsPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/users"
                element={<ProtectedRoute requiredRole="ADMIN"><AdminUsersPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/reports"
                element={<ProtectedRoute requiredRole="ADMIN"><AdminReportsPage /></ProtectedRoute>}
              />

              {/* Catch-all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
