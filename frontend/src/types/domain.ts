/**
 * Frontend domain types — directly mirroring the backend UML domain model.
 * Source of truth: backend/src/types/domain.ts
 */

// ─── UML Domain Enums ────────────────────────────────────────────────────────

export type UserRole      = 'PASSENGER' | 'ADMIN';
export type BookingStatus = 'INITIATED' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'Card' | 'UPI';
export type VehicleType   = 'Train' | 'Bus';
export type ScheduleStatus = 'Active' | 'Cancelled' | 'Completed';
export type AccountStatus  = 'Active' | 'Inactive' | 'Suspended';

// ─── UML Domain: User & Account ──────────────────────────────────────────────

export interface User {
  userId: number;
  userName: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Passenger extends User {
  passengerId: number;
  name: string;
  phoneNo: string;
}

export interface Admin extends User {
  adminId: number;
  name: string;
}

export interface UserAccount {
  accountId: number;
  userId: number;
  accountStatus: AccountStatus;
  lastLogin: string | null;
}

// ─── UML Domain: Transit & Scheduling ────────────────────────────────────────

export interface Train {
  trainId: number;
  trainName: string;
  availableSeats: number;
  totalSeats: number;
}

export interface Bus {
  busId: number;
  busType: string;
  availableSeats: number;
  totalSeats: number;
}

export interface Route {
  routeId: number;
  source: string;
  destination: string;
  distance: number;
}

export interface Schedule {
  scheduleId: number;
  routeId: number;
  trainId: number | null;
  busId:   number | null;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  fare: number;
  status: ScheduleStatus;
}

/** Extended schedule with joined route + vehicle details */
export interface ScheduleWithDetails extends Schedule {
  route: Route;
  train?: Train;
  bus?: Bus;
  vehicleType: VehicleType;
  vehicleNameOrType: string;
  totalSeats: number;
  availableSeats: number;
}

// ─── UML Domain: Booking ─────────────────────────────────────────────────────

export interface PassengerDetail {
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
  seatNumber: string;
  fare: number;
}

export interface Booking {
  bookingId: number;
  passengerId: number;
  scheduleId: number;
  passengerDetails: PassengerDetail[];
  bookingDate: string;
  bookingStatus: BookingStatus;
}

// ─── UML Domain: Payment & Receipt ───────────────────────────────────────────

export interface Payment {
  paymentId: number;
  bookingId: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string;
}

export interface CardPayment extends Payment {
  cardNumberMasked: string;
  cardType: string;
  bankName: string;
}

export interface UPIPayment extends Payment {
  upiId: string;
  provider: string;
}

export interface Receipt {
  receiptId: number;
  bookingId: number;
  ticketNumber: string;
  generateDate: string;
  receiptData: {
    passengerName: string;
    routeSource: string;
    routeDestination: string;
    vehicleType: VehicleType;
    vehicleNameOrType: string;
    departureTime: string;
    journeyDate: string;
    seats: string[];
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  };
}

// ─── Session / Auth ──────────────────────────────────────────────────────────

export interface SessionContext {
  token: string;
  userId: number;
  role: UserRole;
  email: string;
  passengerId?: number;
  adminId?: number;
  expiresAt: string;
}

// ─── API Seat Availability ────────────────────────────────────────────────────

export interface SeatAvailability {
  scheduleId: number;
  vehicleType: VehicleType;
  vehicleNameOrType: string;
  fare: number;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: string[];
  allSeats: string[];
  // backward-compat fields also returned by backend
  reservedSeatNumbers: string[];
  seatMap: { seatNumber: string; isAvailable: boolean; status: 'AVAILABLE' | 'OCCUPIED' }[];
}

// ─── Admin API shapes ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPassengers: number;
  totalAdmins: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingPayments: number;
  totalRevenue: number;
  activeSchedules: number;
  totalTrains: number;
  totalBuses: number;
  totalRoutes: number;
}

export interface AdminBookingRow {
  bookingId: number;
  passengerId: number;
  passengerName: string;
  passengerEmail: string;
  scheduleId: number;
  routeSource: string;
  routeDestination: string;
  vehicleType: VehicleType;
  vehicleNameOrType: string;
  journeyDate: string;
  passengerDetails: PassengerDetail[];
  bookingDate: string;
  bookingStatus: BookingStatus;
  paymentStatus?: PaymentStatus;
  amount?: number;
}

export interface AdminUserRow {
  userId: number;
  userName: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  passengerId?: number;
  passengerName?: string;
  phoneNo?: string;
  accountId?: number;
  accountStatus?: AccountStatus;
  lastLogin?: string;
}
