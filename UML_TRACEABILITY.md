# UML to Code Traceability Matrix
## Ticket Booking and Reservation System

This document outlines the direct 1:1 mapping between the primary UML diagrams (from `/docs`) and the implemented backend code architecture.

---

### 1. Domain Entities Traceability Matrix

| UML Class / Entity | Controller | Service | Repository | Database Table | Role / Status Terminology |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `AuthController` | `AuthService` | `UserRepository` | `users` | Roles: `PASSENGER`, `ADMIN` |
| **Passenger** | `AuthController` | `AuthService` | `PassengerRepository` | `passengers` | Role: `PASSENGER` |
| **Admin** | `AdminController`, `AuthController` | `AuthService`, `ReportService` | `AdminRepository` | `admins` | Role: `ADMIN` |
| **UserAccount** | `AuthController`, `AdminController` | `AuthService`, `SessionManager` | `UserAccountRepository` | `user_accounts` | Status: `Active`, `Inactive`, `Suspended` |
| **Train** (implements `Reservable`) | `ScheduleController` | `ScheduleService`, `TripService` | `TrainRepository` | `trains` | Implements `checkAvailability`, `reserveSeat` |
| **Bus** (implements `Reservable`) | `ScheduleController` | `ScheduleService`, `TripService` | `BusRepository` | `buses` | Implements `checkAvailability`, `reserveSeat` |
| **Route** | `ScheduleController` | `ScheduleService` | `RouteRepository` | `routes` | `routeId`, `source`, `destination`, `distance` |
| **Schedule** | `ScheduleController`, `ReservationController` | `ScheduleService`, `TripService` | `ScheduleRepository` | `schedules` | Constraint: Exclusive Train OR Bus assignment |
| **Booking** | `ReservationController` | `BookingService`, `SeatAvailabilityService` | `BookingRepository` | `bookings` | Status: `INITIATED`, `CONFIRMED`, `CANCELLED` |
| **Payment** (implements `Payable`) | `PaymentController` | `PaymentService` | `PaymentRepository` | `payments` | Status: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| **CardPayment** | `PaymentController` | `PaymentService` | `PaymentRepository` | `card_payments` | PCI Masked: `**** **** **** 1234` |
| **UPIPayment** | `PaymentController` | `PaymentService` | `PaymentRepository` | `upi_payments` | `upiId`, `provider` |
| **Receipt** | `PaymentController` | `PaymentService` | `ReceiptRepository` | `receipts` | `ticketNumber` (`TKT-XXXXX`), receipt JSON |

---

### 2. UML Interfaces Traceability

| UML Interface | Implementation Target | Purpose & Methods |
| :--- | :--- | :--- |
| **`Reservable`** | `TrainRepository.ts`, `BusRepository.ts` | `checkAvailability(scheduleId: number): number`, `reserveSeat(scheduleId: number, seatNumber: string): boolean` |
| **`Payable`** | `PaymentRepository.ts`, `PaymentService.ts` | `processPayment(amount: number)`, `verifyPayment(transactionId: string)` |

---

### 3. Four Modules Architecture Mapping

#### Module 1: Login & User Management
* **UML Diagrams**: Assessment-1 (Use Cases), Assessment-2 (Class & Object Diagram), Assessment-4 (Sequence & Collaboration), Assessment-5 (Activity & Statechart), Assessment-6 (Component & Deployment).
* **Controller**: `AuthController.ts`
* **Services**: `AuthService.ts`, `SessionManager.ts`
* **Repositories**: `UserRepository.ts`, `PassengerRepository.ts`, `AdminRepository.ts`, `UserAccountRepository.ts`
* **Database Tables**: `users`, `passengers`, `admins`, `user_accounts`
* **Endpoints**:
  * `POST /api/auth/register` (Passenger registration with `PASSENGER` role)
  * `POST /api/auth/login` (Role-based authentication returning JWT session)
  * `POST /api/auth/logout` (Session clearance)
  * `GET  /api/auth/me` (Current authenticated user profile)
  * `PUT  /api/auth/profile` (Update passenger name & phone)
  * `POST /api/auth/change-password` (Secure password update)
  * `POST /api/auth/oauth/google` (Google OAuth integration adapter)
  * `POST /api/auth/oauth/apple` (Apple OAuth integration adapter)

#### Module 2: Ticket Search & Reservation
* **UML Diagrams**: Assessment-1 (Use Cases), Assessment-2 (Class & Object Diagram), Assessment-4 (Sequence Diagram), Assessment-5 (Activity & Statechart), Assessment-6 (Component & Deployment).
* **Controller**: `ReservationController.ts`
* **Services**: `TripService.ts`, `SeatAvailabilityService.ts`, `BookingService.ts`
* **Repositories**: `ScheduleRepository.ts`, `TrainRepository.ts`, `BusRepository.ts`, `RouteRepository.ts`, `BookingRepository.ts`
* **Database Tables**: `routes`, `trains`, `buses`, `schedules`, `bookings`
* **Endpoints**:
  * `GET  /api/reservation/search` (Search by source, destination, date, vehicle type)
  * `GET  /api/reservation/trips/:scheduleId` (Detailed schedule & vehicle information)
  * `GET  /api/reservation/seats/availability/:scheduleId` (Real-time seat matrix & auto-hold cleanup)
  * `POST /api/reservation/reserve` (Multi-passenger & multi-seat temporary hold in `INITIATED` status)
  * `GET  /api/reservation/bookings/my` (Passenger booking history)
  * `GET  /api/reservation/bookings/:bookingId` (Specific booking inspection)
  * `POST /api/reservation/bookings/:bookingId/cancel` (Cancel booking & release inventory)

#### Module 3: Payment & Booking Management
* **UML Diagrams**: Assessment-1 (Use Cases), Assessment-2 (Class & Object Diagram), Assessment-4 (Sequence Diagram), Assessment-5 (Activity & Statechart), Assessment-6 (Component & Deployment).
* **Controller**: `PaymentController.ts`
* **Services**: `PaymentService.ts`, `NotificationService.ts`
* **Repositories**: `PaymentRepository.ts`, `ReceiptRepository.ts`, `BookingRepository.ts`
* **Database Tables**: `payments`, `card_payments`, `upi_payments`, `receipts`
* **Endpoints**:
  * `POST /api/payment/process/card` (Card payment simulation $\rightarrow$ `SUCCESS`, confirms booking, generates receipt)
  * `POST /api/payment/process/upi` (UPI payment simulation $\rightarrow$ `SUCCESS`, confirms booking, generates receipt)
  * `GET  /api/payment/receipt/:bookingId` (E-ticket receipt generation & download data)
  * `GET  /api/payment/details/:bookingId` (Payment audit verification)

#### Module 4: Admin & Schedule Management
* **UML Diagrams**: Assessment-1 (Use Cases), Assessment-2 (Class & Object Diagram), Assessment-4 (Sequence Diagram), Assessment-5 (Activity & Statechart), Assessment-6 (Component & Deployment).
* **Controllers**: `AdminController.ts`, `ScheduleController.ts`
* **Services**: `ScheduleService.ts`, `ReportService.ts`
* **Repositories**: `ScheduleRepository.ts`, `RouteRepository.ts`, `TrainRepository.ts`, `BusRepository.ts`, `UserAccountRepository.ts`
* **Database Tables**: `schedules`, `routes`, `trains`, `buses`, `user_accounts`, `admins`
* **Endpoints**:
  * `GET    /api/schedule` (List all transit schedules)
  * `POST   /api/schedule` (Create schedule with exclusive Train OR Bus constraint)
  * `PUT    /api/schedule/:id` (Update schedule details and status)
  * `DELETE /api/schedule/:id` (Delete schedule)
  * `GET    /api/schedule/routes` & `POST /api/schedule/routes` (Route CRUD)
  * `GET    /api/schedule/trains` & `POST /api/schedule/trains` (Train CRUD)
  * `GET    /api/schedule/buses` & `POST /api/schedule/buses` (Bus CRUD)
  * `GET    /api/admin/dashboard-stats` (High-level system KPIs)
  * `GET    /api/admin/users` (Inspect all customer accounts)
  * `PATCH  /api/admin/users/:userId/status` (Toggle Active/Inactive/Suspended status)
  * `GET    /api/admin/bookings` (Audit all passenger bookings)
  * `POST   /api/admin/refunds/approve` (Approve refund requests $\rightarrow$ payment status `REFUNDED`)
  * `GET    /api/admin/reports` (Structured revenue, volume, and occupancy analytics)

---

### 4. External Systems Traceability

| External System | Adapter in Code | Simulated Behavior |
| :--- | :--- | :--- |
| **Payment Gateway** | `adapters/PaymentGatewayAdapter.ts` | Validates masked card parameters and UPI IDs, returning mock transaction IDs and authorization codes. |
| **Notification Service** | `adapters/NotificationServiceAdapter.ts` | Dispatches simulated Email and SMS notifications for booking confirmations, cancellations, and schedule updates. |
| **External Schedule API** | `adapters/ExternalScheduleAdapter.ts` | Provides real-time transit schedule integration mocks for trains and buses. |
| **Google & Apple OAuth** | `adapters/OAuthAdapter.ts` | Verifies social authentication tokens and maps them to User & Passenger accounts. |
