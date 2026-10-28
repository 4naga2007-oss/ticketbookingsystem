import { db, initDatabase } from './database';
import { hashPassword, maskCardNumber } from '../utils/security';

// Helper to generate a future date string YYYY-MM-DD
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export function seedDatabase(): void {
  // Ensure tables exist
  initDatabase();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    console.log('ℹ️ Database already contains data. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding database with realistic sample data...');

  const defaultPasswordHash = hashPassword('Password@123');

  const transaction = db.transaction(() => {
    // ─── 1. Admins ────────────────────────────────────────────────────────────
    const admin1Info = db.prepare(`INSERT INTO users (user_name, email, password, role) VALUES ('admin_main', 'admin@ticketing.com', ?, 'ADMIN')`).run(defaultPasswordHash);
    const admin1UserId = Number(admin1Info.lastInsertRowid);
    db.prepare("INSERT INTO admins (user_id, name, role) VALUES (?, 'System Admin One', 'ADMIN')").run(admin1UserId);
    db.prepare("INSERT INTO user_accounts (user_id, account_status, last_login) VALUES (?, 'Active', CURRENT_TIMESTAMP)").run(admin1UserId);

    const admin2Info = db.prepare(`INSERT INTO users (user_name, email, password, role) VALUES ('admin_ops', 'ops.admin@ticketing.com', ?, 'ADMIN')`).run(defaultPasswordHash);
    const admin2UserId = Number(admin2Info.lastInsertRowid);
    db.prepare("INSERT INTO admins (user_id, name, role) VALUES (?, 'Operations Admin Two', 'ADMIN')").run(admin2UserId);
    db.prepare("INSERT INTO user_accounts (user_id, account_status, last_login) VALUES (?, 'Active', CURRENT_TIMESTAMP)").run(admin2UserId);

    // ─── 2. Passengers ────────────────────────────────────────────────────────
    const passengersData = [
      { userName: 'alice99',     email: 'alice@email.com',   name: 'Alice Smith',    phoneNo: '9876543210' },
      { userName: 'bob_runner',  email: 'bob@email.com',     name: 'Bob Johnson',    phoneNo: '9876543211' },
      { userName: 'charlie_k',   email: 'charlie@email.com', name: 'Charlie Kumar',  phoneNo: '9876543212' },
      { userName: 'david_m',     email: 'david@email.com',   name: 'David Miller',   phoneNo: '9876543213' },
      { userName: 'eva_green',   email: 'eva@email.com',     name: 'Eva Green',      phoneNo: '9876543214' },
      { userName: 'priya_r',     email: 'priya@email.com',   name: 'Priya Rajan',    phoneNo: '9876543215' },
      { userName: 'rahul_v',     email: 'rahul@email.com',   name: 'Rahul Verma',    phoneNo: '9876543216' },
    ];

    const passengerIds: number[] = [];
    for (const p of passengersData) {
      const uInfo = db.prepare('INSERT INTO users (user_name, email, password, role) VALUES (?, ?, ?, ?)').run(p.userName, p.email, defaultPasswordHash, 'PASSENGER');
      const uId = Number(uInfo.lastInsertRowid);
      const pInfo = db.prepare('INSERT INTO passengers (user_id, name, phone_no) VALUES (?, ?, ?)').run(uId, p.name, p.phoneNo);
      passengerIds.push(Number(pInfo.lastInsertRowid));
      db.prepare("INSERT INTO user_accounts (user_id, account_status, last_login) VALUES (?, 'Active', CURRENT_TIMESTAMP)").run(uId);
    }

    // ─── 3. Trains ────────────────────────────────────────────────────────────
    const trainStmt = db.prepare('INSERT INTO trains (train_name, available_seats, total_seats) VALUES (?, ?, ?)');
    const t1  = Number(trainStmt.run('Cheran Express (12673)', 40, 40).lastInsertRowid);
    const t2  = Number(trainStmt.run('Kovai Superfast Express (12675)', 50, 50).lastInsertRowid);
    const t3  = Number(trainStmt.run('Vande Bharat Express (20643)', 45, 45).lastInsertRowid);
    const t4  = Number(trainStmt.run('Chennai Express (12631)', 42, 42).lastInsertRowid);
    const t5  = Number(trainStmt.run('Rajdhani Express (12431)', 48, 48).lastInsertRowid);
    const t6  = Number(trainStmt.run('Shatabdi Express (12007)', 52, 52).lastInsertRowid);
    const t7  = Number(trainStmt.run('Duronto Express (12213)', 38, 38).lastInsertRowid);
    const t8  = Number(trainStmt.run('Intercity Express (12083)', 44, 44).lastInsertRowid);
    const t9  = Number(trainStmt.run('Mysuru Shatabdi (12007)', 46, 46).lastInsertRowid);
    const t10 = Number(trainStmt.run('Kerala Express (12625)', 50, 50).lastInsertRowid);
    const t11 = Number(trainStmt.run('Coromandel Express (12841)', 54, 54).lastInsertRowid);
    const t12 = Number(trainStmt.run('Howrah Mail (12839)', 48, 48).lastInsertRowid);

    // ─── 4. Buses ─────────────────────────────────────────────────────────────
    const busStmt = db.prepare('INSERT INTO buses (bus_type, available_seats, total_seats) VALUES (?, ?, ?)');
    const b1  = Number(busStmt.run('KPN AC Multi-Axle Sleeper (2+1)', 30, 30).lastInsertRowid);
    const b2  = Number(busStmt.run('SRS Semi-Sleeper AC (2+2)', 36, 36).lastInsertRowid);
    const b3  = Number(busStmt.run('SETC Ultra Deluxe Non-AC', 40, 40).lastInsertRowid);
    const b4  = Number(busStmt.run('GreenLine Travels Scania AC', 32, 32).lastInsertRowid);
    const b5  = Number(busStmt.run('KSRTC Airavat Club Class AC', 34, 34).lastInsertRowid);
    const b6  = Number(busStmt.run('Orange Travels Volvo Multi-Axle AC', 28, 28).lastInsertRowid);
    const b7  = Number(busStmt.run('TNSTC Deluxe AC (2+2)', 40, 40).lastInsertRowid);
    const b8  = Number(busStmt.run('VRL Travels AC Sleeper', 30, 30).lastInsertRowid);
    const b9  = Number(busStmt.run('Parveen Travels AC (2+1)', 32, 32).lastInsertRowid);
    const b10 = Number(busStmt.run('MSRTC Shivneri AC', 44, 44).lastInsertRowid);

    // ─── 5. Routes ─────────────────────────────────────────────────────────────
    const routeStmt = db.prepare('INSERT INTO routes (source, destination, distance) VALUES (?, ?, ?)');
    // Tamil Nadu / Karnataka
    const r1  = Number(routeStmt.run('Chennai',            'Bengaluru',           350.0).lastInsertRowid);
    const r2  = Number(routeStmt.run('Chennai',            'Coimbatore',          505.0).lastInsertRowid);
    const r3  = Number(routeStmt.run('Bengaluru',          'Chennai',             350.0).lastInsertRowid);
    const r4  = Number(routeStmt.run('Coimbatore',         'Chennai',             505.0).lastInsertRowid);
    const r5  = Number(routeStmt.run('Bengaluru',          'Mysuru',              145.0).lastInsertRowid);
    const r6  = Number(routeStmt.run('Chennai',            'Madurai',             462.0).lastInsertRowid);
    const r7  = Number(routeStmt.run('Chennai',            'Trichy',              330.0).lastInsertRowid);
    const r8  = Number(routeStmt.run('Bengaluru',          'Coimbatore',          360.0).lastInsertRowid);
    const r9  = Number(routeStmt.run('Coimbatore',         'Bengaluru',           360.0).lastInsertRowid);
    const r10 = Number(routeStmt.run('Chennai',            'Vellore',             145.0).lastInsertRowid);
    const r11 = Number(routeStmt.run('Chennai',            'Salem',               340.0).lastInsertRowid);
    // Maharashtra
    const r12 = Number(routeStmt.run('Mumbai',             'Pune',                150.0).lastInsertRowid);
    const r13 = Number(routeStmt.run('Pune',               'Mumbai',              150.0).lastInsertRowid);
    const r14 = Number(routeStmt.run('Mumbai',             'Nashik',              165.0).lastInsertRowid);
    // Delhi / North India
    const r15 = Number(routeStmt.run('Delhi',              'Agra',                200.0).lastInsertRowid);
    const r16 = Number(routeStmt.run('Delhi',              'Jaipur',              280.0).lastInsertRowid);
    const r17 = Number(routeStmt.run('Delhi',              'Chandigarh',          250.0).lastInsertRowid);
    // Andhra / Telangana
    const r18 = Number(routeStmt.run('Hyderabad',          'Vijayawada',          275.0).lastInsertRowid);
    const r19 = Number(routeStmt.run('Hyderabad',          'Bengaluru',           570.0).lastInsertRowid);
    const r20 = Number(routeStmt.run('Vijayawada',         'Hyderabad',           275.0).lastInsertRowid);
    // Kerala
    const r21 = Number(routeStmt.run('Kochi',              'Thiruvananthapuram',  205.0).lastInsertRowid);
    const r22 = Number(routeStmt.run('Thiruvananthapuram', 'Kochi',               205.0).lastInsertRowid);
    const r23 = Number(routeStmt.run('Chennai',            'Kochi',               680.0).lastInsertRowid);
    // East India
    const r24 = Number(routeStmt.run('Kolkata',            'Bhubaneswar',         440.0).lastInsertRowid);
    const r25 = Number(routeStmt.run('Bhubaneswar',        'Kolkata',             440.0).lastInsertRowid);

    // ─── 6. Schedules with future rolling dates ────────────────────────────────
    const d1 = futureDate(1);
    const d2 = futureDate(2);
    const d3 = futureDate(3);
    const d4 = futureDate(4);
    const d5 = futureDate(5);

    const schedStmt = db.prepare(`
      INSERT INTO schedules (route_id, train_id, bus_id, departure_time, arrival_time, journey_date, fare, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `);

    // Day 1 schedules
    const s1  = Number(schedStmt.run(r1,  t3,   null, '05:50', '10:20', d1,  850.0).lastInsertRowid);  // Train  Chennai→Bengaluru
    const s2  = Number(schedStmt.run(r1,  null, b1,   '22:30', '05:30', d1,  650.0).lastInsertRowid);  // Bus    Chennai→Bengaluru
    const s3  = Number(schedStmt.run(r2,  t1,   null, '22:10', '06:00', d1,  450.0).lastInsertRowid);  // Train  Chennai→Coimbatore
    const s4  = Number(schedStmt.run(r2,  null, b4,   '21:00', '05:45', d1,  380.0).lastInsertRowid);  // Bus    Chennai→Coimbatore
    const s5  = Number(schedStmt.run(r12, t5,   null, '06:00', '09:30', d1,  600.0).lastInsertRowid);  // Train  Mumbai→Pune
    const s6  = Number(schedStmt.run(r12, null, b10,  '07:00', '10:00', d1,  250.0).lastInsertRowid);  // Bus    Mumbai→Pune
    const s7  = Number(schedStmt.run(r15, t6,   null, '06:15', '08:15', d1,  550.0).lastInsertRowid);  // Train  Delhi→Agra
    const s8  = Number(schedStmt.run(r18, t8,   null, '08:00', '12:30', d1,  480.0).lastInsertRowid);  // Train  Hyderabad→Vijayawada
    const s9  = Number(schedStmt.run(r21, null, b5,   '07:30', '11:00', d1,  320.0).lastInsertRowid);  // Bus    Kochi→TVM

    // Day 2 schedules
    const s10 = Number(schedStmt.run(r3,  t4,   null, '14:30', '19:45', d2,  520.0).lastInsertRowid);  // Train  Bengaluru→Chennai
    const s11 = Number(schedStmt.run(r3,  null, b2,   '21:00', '04:30', d2,  420.0).lastInsertRowid);  // Bus    Bengaluru→Chennai
    const s12 = Number(schedStmt.run(r5,  t9,   null, '11:00', '13:30', d2,  350.0).lastInsertRowid);  // Train  Bengaluru→Mysuru
    const s13 = Number(schedStmt.run(r5,  null, b5,   '07:00', '10:00', d2,  250.0).lastInsertRowid);  // Bus    Bengaluru→Mysuru
    const s14 = Number(schedStmt.run(r6,  t2,   null, '07:00', '14:00', d2,  520.0).lastInsertRowid);  // Train  Chennai→Madurai
    const s15 = Number(schedStmt.run(r6,  null, b3,   '20:00', '05:00', d2,  390.0).lastInsertRowid);  // Bus    Chennai→Madurai
    const s16 = Number(schedStmt.run(r16, null, b6,   '06:00', '11:00', d2,  420.0).lastInsertRowid);  // Bus    Delhi→Jaipur
    const s17 = Number(schedStmt.run(r13, null, b10,  '08:00', '11:30', d2,  260.0).lastInsertRowid);  // Bus    Pune→Mumbai
    const s18 = Number(schedStmt.run(r19, t7,   null, '20:00', '09:00', d2,  950.0).lastInsertRowid);  // Train  Hyderabad→Bengaluru
    const s19 = Number(schedStmt.run(r24, t11,  null, '07:45', '16:00', d2,  720.0).lastInsertRowid);  // Train  Kolkata→Bhubaneswar

    // Day 3 schedules
    const s20 = Number(schedStmt.run(r7,  t1,   null, '06:15', '10:45', d3,  350.0).lastInsertRowid);  // Train  Chennai→Trichy
    const s21 = Number(schedStmt.run(r7,  null, b7,   '21:30', '03:00', d3,  280.0).lastInsertRowid);  // Bus    Chennai→Trichy
    const s22 = Number(schedStmt.run(r8,  t3,   null, '07:00', '12:30', d3,  480.0).lastInsertRowid);  // Train  Bengaluru→Coimbatore
    const s23 = Number(schedStmt.run(r8,  null, b8,   '22:00', '05:30', d3,  380.0).lastInsertRowid);  // Bus    Bengaluru→Coimbatore
    const s24 = Number(schedStmt.run(r9,  null, b9,   '20:30', '05:00', d3,  360.0).lastInsertRowid);  // Bus    Coimbatore→Bengaluru
    const s25 = Number(schedStmt.run(r14, null, b10,  '07:00', '10:30', d3,  280.0).lastInsertRowid);  // Bus    Mumbai→Nashik
    const s26 = Number(schedStmt.run(r17, t5,   null, '07:30', '10:45', d3,  550.0).lastInsertRowid);  // Train  Delhi→Chandigarh
    const s27 = Number(schedStmt.run(r23, t10,  null, '19:30', '11:00', d3,  1100.0).lastInsertRowid); // Train  Chennai→Kochi
    const s28 = Number(schedStmt.run(r22, null, b4,   '07:00', '11:30', d3,  300.0).lastInsertRowid);  // Bus    TVM→Kochi

    // Day 4 schedules
    const s29 = Number(schedStmt.run(r1,  t6,   null, '16:00', '21:30', d4,  820.0).lastInsertRowid);  // Train  Chennai→Bengaluru
    const s30 = Number(schedStmt.run(r1,  null, b6,   '23:00', '06:00', d4,  600.0).lastInsertRowid);  // Bus    Chennai→Bengaluru
    const s31 = Number(schedStmt.run(r11, null, b3,   '20:30', '02:30', d4,  250.0).lastInsertRowid);  // Bus    Chennai→Salem
    const s32 = Number(schedStmt.run(r10, null, b7,   '06:00', '08:30', d4,  180.0).lastInsertRowid);  // Bus    Chennai→Vellore
    const s33 = Number(schedStmt.run(r20, t8,   null, '10:00', '14:30', d4,  460.0).lastInsertRowid);  // Train  Vijayawada→Hyderabad
    const s34 = Number(schedStmt.run(r25, t12,  null, '22:00', '06:30', d4,  680.0).lastInsertRowid);  // Train  Bhubaneswar→Kolkata

    // Day 5 schedules
    const s35 = Number(schedStmt.run(r2,  t2,   null, '06:00', '14:30', d5,  440.0).lastInsertRowid);  // Train  Chennai→Coimbatore
    const s36 = Number(schedStmt.run(r4,  t4,   null, '07:30', '16:00', d5,  430.0).lastInsertRowid);  // Train  Coimbatore→Chennai
    const s37 = Number(schedStmt.run(r4,  null, b1,   '21:00', '05:30', d5,  360.0).lastInsertRowid);  // Bus    Coimbatore→Chennai
    const s38 = Number(schedStmt.run(r12, t6,   null, '17:00', '20:30', d5,  580.0).lastInsertRowid);  // Train  Mumbai→Pune
    const s39 = Number(schedStmt.run(r15, null, b6,   '06:00', '10:30', d5,  380.0).lastInsertRowid);  // Bus    Delhi→Agra

    // ─── 7. Sample Bookings / Payments / Receipts ──────────────────────────────

    // Booking 1: CONFIRMED with Card Payment — Alice on Train Chennai→Bengaluru (Day 1)
    const bkg1PassDetails = [
      { passengerName: 'Alice Smith',  passengerAge: 28, passengerGender: 'Female', seatNumber: 'T01', fare: 850.0 },
      { passengerName: 'John Smith',   passengerAge: 32, passengerGender: 'Male',   seatNumber: 'T02', fare: 850.0 },
    ];
    const bkg1 = Number(db.prepare(`INSERT INTO bookings (passenger_id, schedule_id, passenger_details, booking_status) VALUES (?, ?, ?, 'CONFIRMED')`).run(passengerIds[0], s1, JSON.stringify(bkg1PassDetails)).lastInsertRowid);
    db.prepare('UPDATE trains SET available_seats = available_seats - 2 WHERE train_id = ?').run(t3);
    const pay1 = Number(db.prepare(`INSERT INTO payments (booking_id, amount, payment_status, payment_method) VALUES (?, ?, 'SUCCESS', 'Card')`).run(bkg1, 1700.0).lastInsertRowid);
    db.prepare('INSERT INTO card_payments (payment_id, card_number_masked, card_type, bank_name) VALUES (?, ?, ?, ?)').run(pay1, maskCardNumber('4111222233334567'), 'Visa', 'HDFC Bank');
    db.prepare(`INSERT INTO receipts (booking_id, ticket_number, generate_date, receipt_data) VALUES (?, 'TKT-99887-101', date('now'), ?)`).run(bkg1, JSON.stringify({
      passengerName: 'Alice Smith', routeSource: 'Chennai', routeDestination: 'Bengaluru',
      vehicleType: 'Train', vehicleNameOrType: 'Vande Bharat Express (20643)',
      departureTime: '05:50', journeyDate: d1, seats: ['T01', 'T02'], totalAmount: 1700.0,
      paymentMethod: 'Card', paymentStatus: 'SUCCESS',
    }));

    // Booking 2: CONFIRMED with UPI Payment — Bob on Bus Chennai→Bengaluru (Day 1)
    const bkg2PassDetails = [
      { passengerName: 'Bob Johnson', passengerAge: 30, passengerGender: 'Male', seatNumber: 'B05', fare: 650.0 },
    ];
    const bkg2 = Number(db.prepare(`INSERT INTO bookings (passenger_id, schedule_id, passenger_details, booking_status) VALUES (?, ?, ?, 'CONFIRMED')`).run(passengerIds[1], s2, JSON.stringify(bkg2PassDetails)).lastInsertRowid);
    db.prepare('UPDATE buses SET available_seats = available_seats - 1 WHERE bus_id = ?').run(b1);
    const pay2 = Number(db.prepare(`INSERT INTO payments (booking_id, amount, payment_status, payment_method) VALUES (?, ?, 'SUCCESS', 'UPI')`).run(bkg2, 650.0).lastInsertRowid);
    db.prepare('INSERT INTO upi_payments (payment_id, upi_id, provider) VALUES (?, ?, ?)').run(pay2, 'bob@okaxis', 'Google Pay');
    db.prepare(`INSERT INTO receipts (booking_id, ticket_number, generate_date, receipt_data) VALUES (?, 'TKT-99887-102', date('now'), ?)`).run(bkg2, JSON.stringify({
      passengerName: 'Bob Johnson', routeSource: 'Chennai', routeDestination: 'Bengaluru',
      vehicleType: 'Bus', vehicleNameOrType: 'KPN AC Multi-Axle Sleeper (2+1)',
      departureTime: '22:30', journeyDate: d1, seats: ['B05'], totalAmount: 650.0,
      paymentMethod: 'UPI', paymentStatus: 'SUCCESS',
    }));

    // Booking 3: CONFIRMED — Charlie on Train Mumbai→Pune (Day 1)
    const bkg3PassDetails = [
      { passengerName: 'Charlie Kumar', passengerAge: 25, passengerGender: 'Male', seatNumber: 'T03', fare: 600.0 },
    ];
    const bkg3 = Number(db.prepare(`INSERT INTO bookings (passenger_id, schedule_id, passenger_details, booking_status) VALUES (?, ?, ?, 'CONFIRMED')`).run(passengerIds[2], s5, JSON.stringify(bkg3PassDetails)).lastInsertRowid);
    db.prepare('UPDATE trains SET available_seats = available_seats - 1 WHERE train_id = ?').run(t5);
    const pay3 = Number(db.prepare(`INSERT INTO payments (booking_id, amount, payment_status, payment_method) VALUES (?, ?, 'SUCCESS', 'UPI')`).run(bkg3, 600.0).lastInsertRowid);
    db.prepare('INSERT INTO upi_payments (payment_id, upi_id, provider) VALUES (?, ?, ?)').run(pay3, 'charlie@oksbi', 'PhonePe');
    db.prepare(`INSERT INTO receipts (booking_id, ticket_number, generate_date, receipt_data) VALUES (?, 'TKT-99887-103', date('now'), ?)`).run(bkg3, JSON.stringify({
      passengerName: 'Charlie Kumar', routeSource: 'Mumbai', routeDestination: 'Pune',
      vehicleType: 'Train', vehicleNameOrType: 'Rajdhani Express (12431)',
      departureTime: '06:00', journeyDate: d1, seats: ['T03'], totalAmount: 600.0,
      paymentMethod: 'UPI', paymentStatus: 'SUCCESS',
    }));

    // Booking 4: CANCELLED — David on Train Delhi→Agra (Day 1)
    const bkg4PassDetails = [
      { passengerName: 'David Miller', passengerAge: 45, passengerGender: 'Male', seatNumber: 'T10', fare: 550.0 },
    ];
    const bkg4 = Number(db.prepare(`INSERT INTO bookings (passenger_id, schedule_id, passenger_details, booking_status) VALUES (?, ?, ?, 'CANCELLED')`).run(passengerIds[3], s7, JSON.stringify(bkg4PassDetails)).lastInsertRowid);
    const pay4 = Number(db.prepare(`INSERT INTO payments (booking_id, amount, payment_status, payment_method) VALUES (?, ?, 'REFUNDED', 'Card')`).run(bkg4, 550.0).lastInsertRowid);
    db.prepare('INSERT INTO card_payments (payment_id, card_number_masked, card_type, bank_name) VALUES (?, ?, ?, ?)').run(pay4, maskCardNumber('5200000000000007'), 'Mastercard', 'ICICI Bank');
  });

  transaction();
  console.log('✅ Database seeded successfully with PASSENGER/ADMIN, 25 Routes, 12 Trains, 10 Buses, 39 Schedules (future dates), and sample Bookings/Payments.');
}
