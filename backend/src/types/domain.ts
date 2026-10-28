/**
 * Ticket Booking and Reservation System
 * UML Domain Types and Interfaces (Primary Source of Truth)
 */

// ==============================
// UML Interfaces
// ==============================

export interface Reservable {
  checkAvailability(scheduleId: number): number;
  reserveSeat(scheduleId: number, seatNumber: string): boolean;
}

export interface Payable {
  processPayment(amount: number): Promise<{ success: boolean; transactionId: string; message: string }>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

// ==============================
// UML Domain Entities: User & Account
// ==============================

export type UserRole = 'PASSENGER' | 'ADMIN';

export interface User {
  userId: number;
  userName: string;
  email: string;
  password?: string;
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
  role: UserRole;
}

export interface UserAccount {
  accountId: number;
  userId: number;
  accountStatus: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string | null;
}

// ==============================
// UML Domain Entities: Transit & Scheduling
// ==============================

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
  busId: number | null;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  fare: number;
  status: 'Active' | 'Cancelled' | 'Completed';
}

// ==============================
// UML Domain Entities: Booking & Internal Passenger Detail
// ==============================

export interface PassengerDetail {
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
  seatNumber: string;
  fare: number;
}

export type BookingStatus = 'INITIATED' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  bookingId: number;
  passengerId: number;
  scheduleId: number;
  passengerDetails: PassengerDetail[];
  bookingDate: string;
  bookingStatus: BookingStatus;
}

// ==============================
// UML Domain Entities: Payment & Receipts
// ==============================

export type PaymentMethod = 'Card' | 'UPI';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  paymentId: number;
  bookingId: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string;
}

export interface CardPayment extends Payment {
  cardNumberMasked: string; // e.g. "**** **** **** 1234"
  cardType: string;         // e.g. "Visa", "Mastercard", "RuPay"
  bankName: string;
}

export interface UPIPayment extends Payment {
  upiId: string;
  provider: string;         // e.g. "Google Pay", "PhonePe", "Paytm"
}

export interface Receipt {
  receiptId: number;
  bookingId: number;
  ticketNumber: string;     // e.g. "TKT-99887"
  generateDate: string;
  receiptData: {
    passengerName: string;
    routeSource: string;
    routeDestination: string;
    vehicleType: 'Train' | 'Bus';
    vehicleNameOrType: string;
    departureTime: string;
    journeyDate: string;
    seats: string[];
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  };
}
