import http from 'http';
import { db } from './config/database';
import { BookingService } from './services/BookingService';

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Full System Backend API Verification (Corrected Part 7)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.data.status === 'UP', 'API Health Check returns 200 UP');

    // 2. Auth: Register (with PASSENGER role)
    const uniqueId = Date.now();
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        userName: 'test_pass_' + uniqueId,
        email: `tester_${uniqueId}@test.com`,
        password: 'Password@123',
        name: 'Test Passenger',
        phoneNo: '9123456780',
      }
    );
    assert(
      regRes.status === 201 &&
        regRes.data.success &&
        regRes.data.data.session.role === 'PASSENGER',
      'Register new passenger returns 201 with PASSENGER role'
    );

    // 3. Auth: Login Passenger
    const passLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        emailOrUsername: 'alice@email.com',
        password: 'Password@123',
      }
    );
    assert(
      passLogin.status === 200 &&
        passLogin.data.data.session.role === 'PASSENGER',
      'Passenger Alice Login returns 200 with JWT and PASSENGER role'
    );
    const passengerToken = passLogin.data.data.session.token;

    // 4. Auth: Login Admin
    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        emailOrUsername: 'admin@ticketing.com',
        password: 'Password@123',
      }
    );
    assert(
      adminLogin.status === 200 &&
        adminLogin.data.data.session.role === 'ADMIN',
      'Admin Login returns 200 with JWT and ADMIN role'
    );
    const adminToken = adminLogin.data.data.session.token;

    // 5. Auth: Get Current Profile
    const meRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert(meRes.status === 200 && meRes.data.data.user.email === 'alice@email.com', 'Get current passenger profile');

    // 6. Auth: Update Profile
    const updateProfRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/profile',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        name: 'Alice Smith Updated',
        phoneNo: '9876543210',
      }
    );
    assert(updateProfRes.status === 200 && updateProfRes.data.data.name === 'Alice Smith Updated', 'Update profile');

    // 7. Auth: OAuth Google simulation
    const gAuth = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/oauth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { token: 'sample_google_oauth_token' }
    );
    assert(gAuth.status === 200 && gAuth.data.success, 'Google OAuth login returns 200');

    // 8. Authorization check: Passenger blocked from Admin API (403)
    const blockedRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard-stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert(blockedRes.status === 403, 'Passenger accessing Admin route rejected with 403 Forbidden');

    // 9. Authorization check: Unauthenticated access rejected (401)
    const unauthRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard-stats',
      method: 'GET',
    });
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    // 10. Module 2: Search Trips
    const searchRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reservation/search?source=Chennai&destination=Bengaluru',
      method: 'GET',
    });
    assert(searchRes.status === 200 && searchRes.data.count >= 2, 'Search Trips for Chennai -> Bengaluru returns Train & Bus options');

    // 11. Module 2: Seat Availability Matrix
    const seatsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reservation/seats/availability/1',
      method: 'GET',
    });
    assert(seatsRes.status === 200 && seatsRes.data.data.seatMap.length > 0, 'Seat availability matrix generated accurately');

    // 12. Module 2: Multi-Seat Temporary Reservation Hold (Train)
    const holdRes1 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/reservation/reserve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        scheduleId: 3, // Chennai -> Coimbatore Train
        passengerDetails: [
          { passengerName: 'Alice Smith', passengerAge: 28, passengerGender: 'Female', seatNumber: 'T11' },
          { passengerName: 'Bob Smith', passengerAge: 32, passengerGender: 'Male', seatNumber: 'T12' },
        ],
      }
    );
    assert(
      holdRes1.status === 201 &&
        holdRes1.data.data.bookingStatus === 'INITIATED',
      'Multi-seat reservation hold created in INITIATED status'
    );
    const bookingCardId = holdRes1.data.data.bookingId;

    // 13. Module 3: Card Payment Processing (with masked card storage & SUCCESS status)
    const payCardRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payment/process/card',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        bookingId: bookingCardId,
        amount: 900.0,
        cardNumber: '4111 2222 3333 8888',
        cardType: 'Mastercard',
        bankName: 'ICICI Bank',
        expiry: '09/29',
      }
    );
    assert(
      payCardRes.status === 200 &&
        payCardRes.data.data.payment.paymentStatus === 'SUCCESS' &&
        payCardRes.data.data.payment.cardNumberMasked === '**** **** **** 8888' &&
        payCardRes.data.data.receipt.ticketNumber.startsWith('TKT-'),
      'Card payment processed, card masked, booking confirmed, payment status set to SUCCESS'
    );

    // 14. Module 2: Multi-Seat Reservation Hold (Bus) & UPI Payment (SUCCESS)
    const holdRes2 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/reservation/reserve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        scheduleId: 2, // Chennai -> Bengaluru Bus
        passengerDetails: [
          { passengerName: 'Alice Smith', passengerAge: 28, passengerGender: 'Female', seatNumber: 'B15' },
        ],
      }
    );
    const bookingUpiId = holdRes2.data.data.bookingId;

    const payUpiRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payment/process/upi',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        bookingId: bookingUpiId,
        amount: 650.0,
        upiId: 'alice@okicici',
        provider: 'PhonePe',
      }
    );
    assert(
      payUpiRes.status === 200 &&
        payUpiRes.data.data.payment.paymentMethod === 'UPI' &&
        payUpiRes.data.data.payment.paymentStatus === 'SUCCESS',
      'UPI payment processed with SUCCESS status'
    );

    // 15. Module 3: Get Receipt
    const receiptRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/payment/receipt/${bookingCardId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert(receiptRes.status === 200 && receiptRes.data.data.receiptData.seats.length === 2, 'Receipt retrieved with complete trip and multi-seat details');

    // 16. Module 3: Booking Cancellation & Refund Workflow
    const cancelRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/reservation/bookings/${bookingCardId}/cancel`,
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert(cancelRes.status === 200 && cancelRes.data.success, 'Booking cancelled by passenger');

    // 17. Module 4 & 3: Admin Approves Refund -> Payment status becomes REFUNDED
    const refundApproveRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/refunds/approve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { bookingId: bookingCardId }
    );
    assert(
      refundApproveRes.status === 200 && refundApproveRes.data.refundStatus === 'REFUNDED',
      'Admin approves refund and payment status transitions to REFUNDED'
    );

    // 18. Module 2: Temporary Reservation Expiry Verification
    // 18. Module 2: Temporary Reservation Expiry Verification (PATH 2: via BookingService)
    // Step a: Create a temporary hold for seat T25
    const holdExpiryTest = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/reservation/reserve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        scheduleId: 3,
        passengerDetails: [{ passengerName: 'Expiry Tester', passengerAge: 25, passengerGender: 'Male', seatNumber: 'T25' }],
      }
    );
    const holdBookingId = holdExpiryTest.data.data.bookingId;
    assert(holdExpiryTest.status === 201, 'Temporary hold created for seat T25 (Booking INITIATED)');

    // Step b: Verify seat T25 is currently OCCUPIED
    const seatsBefore = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reservation/seats/availability/3',
      method: 'GET',
    });
    const seatT25Before = seatsBefore.data.data.seatMap.find((s: any) => s.seatNumber === 'T25');
    assert(seatT25Before && seatT25Before.status === 'OCCUPIED', 'Seat T25 is verified as OCCUPIED while hold is active');

    // Step c: Simulate hold window elapsed (backdate booking_date in DB to 15 minutes ago)
    db.prepare("UPDATE bookings SET booking_date = datetime('now', '-15 minutes') WHERE booking_id = ?").run(holdBookingId);

    // Step d: Trigger cleanup / re-check seat availability
    const bookingService = new BookingService();
    const cleanupResult = bookingService.cleanupExpiredHolds(10);
    assert(cleanupResult.expiredCount >= 1, 'Expired hold detected and cleaned up by BookingService');

    // Step e: Verify seat T25 is now AVAILABLE again
    const seatsAfter = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reservation/seats/availability/3',
      method: 'GET',
    });
    const seatT25After = seatsAfter.data.data.seatMap.find((s: any) => s.seatNumber === 'T25');
    assert(seatT25After && seatT25After.status === 'AVAILABLE', 'Seat T25 successfully released and status returned to AVAILABLE');

    // 18b. Module 2: Temporary Reservation Expiry Verification (PATH 1: via GET /reservation/seats/availability/:id)
    // Step a: Create a temporary hold for seat T26
    const path1Hold = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/reservation/reserve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passengerToken}`,
        },
      },
      {
        scheduleId: 3,
        passengerDetails: [{ passengerName: 'Path1 Expiry Tester', passengerAge: 30, passengerGender: 'Female', seatNumber: 'T26' }],
      }
    );
    const path1BookingId = path1Hold.data.data.bookingId;
    assert(path1Hold.status === 201, 'PATH 1 hold created for seat T26 (Booking INITIATED)');

    // Step b: Simulate hold window elapsed (backdate booking_date in DB to 15 minutes ago)
    db.prepare("UPDATE bookings SET booking_date = datetime('now', '-15 minutes') WHERE booking_id = ?").run(path1BookingId);

    // Step c: Call GET /reservation/seats/availability/3 directly (triggers cleanupStaleHolds PATH 1)
    const path1SeatsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reservation/seats/availability/3',
      method: 'GET',
    });
    assert(path1SeatsRes.status === 200, 'GET seat availability returns 200 via PATH 1');

    // Step d: Verify booking status updated to CANCELLED and seat T26 restored to AVAILABLE
    const updatedBooking = db.prepare('SELECT booking_status FROM bookings WHERE booking_id = ?').get(path1BookingId) as { booking_status: string };
    const seatT26After = path1SeatsRes.data.data.seatMap.find((s: any) => s.seatNumber === 'T26');
    assert(
      updatedBooking.booking_status === 'CANCELLED' && seatT26After && seatT26After.status === 'AVAILABLE',
      'PATH 1 GET endpoint automatically cancelled expired booking and restored seat T26 availability counter'
    );

    // 19. Module 4: Schedule Constraint Validation (Train OR Bus, never both, never neither)
    const invalidBothRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/schedule',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        routeId: 1,
        trainId: 1,
        busId: 1, // Invalid: both assigned
        departureTime: '10:00 AM',
        arrivalTime: '14:00 PM',
        journeyDate: '2026-10-20',
        fare: 500.0,
      }
    );
    assert(invalidBothRes.status === 400, 'Schedule creation with BOTH Train and Bus rejected with 400');

    const invalidNeitherRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/schedule',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        routeId: 1,
        trainId: null,
        busId: null, // Invalid: neither assigned
        departureTime: '10:00 AM',
        arrivalTime: '14:00 PM',
        journeyDate: '2026-10-20',
        fare: 500.0,
      }
    );
    assert(invalidNeitherRes.status === 400, 'Schedule creation with NEITHER Train nor Bus rejected with 400');

    // 20. Module 4: Valid Admin Schedule Creation
    const validSchedRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/schedule',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        routeId: 2,
        trainId: 2,
        busId: null,
        departureTime: '06:15 AM',
        arrivalTime: '13:45 PM',
        journeyDate: '2026-10-25',
        fare: 620.0,
      }
    );
    assert(validSchedRes.status === 201 && validSchedRes.data.success, 'Valid Schedule (assigned to Train only) created by Admin');

    // 21. Module 4: Admin User Management
    const usersRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(usersRes.status === 200 && usersRes.data.count > 0, 'Admin can view all registered users and account statuses');

    // 22. Module 4: Admin Dashboard & System Reports
    const reportRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/reports',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      reportRes.status === 200 &&
        reportRes.data.data.summary.totalRevenue > 0 &&
        reportRes.data.data.routePerformance.length > 0,
      'Admin system analytics report generated with revenue, booking volume, and route stats'
    );

    console.log(`\n📊 Complete Verification Summary: ${passed} Passed, ${failed} Failed\n`);
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests();
