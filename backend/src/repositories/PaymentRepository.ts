import { db } from '../config/database';
import { Payment, CardPayment, UPIPayment, PaymentMethod, PaymentStatus, Payable } from '../types/domain';
import { maskCardNumber } from '../utils/security';

export class PaymentRepository implements Payable {
  public createCardPayment(
    bookingId: number,
    amount: number,
    cardNumber: string,
    cardType: string,
    bankName: string,
    status: PaymentStatus = 'PENDING'
  ): CardPayment {
    const masked = maskCardNumber(cardNumber);

    const transaction = db.transaction(() => {
      const pStmt = db.prepare(`
        INSERT INTO payments (booking_id, amount, payment_status, payment_method)
        VALUES (?, ?, ?, 'Card')
      `);
      const pInfo = pStmt.run(bookingId, amount, status);
      const paymentId = Number(pInfo.lastInsertRowid);

      const cStmt = db.prepare(`
        INSERT INTO card_payments (payment_id, card_number_masked, card_type, bank_name)
        VALUES (?, ?, ?, ?)
      `);
      cStmt.run(paymentId, masked, cardType, bankName);

      return this.findCardPaymentById(paymentId)!;
    });

    return transaction();
  }

  public createUPIPayment(
    bookingId: number,
    amount: number,
    upiId: string,
    provider: string,
    status: PaymentStatus = 'PENDING'
  ): UPIPayment {
    const transaction = db.transaction(() => {
      const pStmt = db.prepare(`
        INSERT INTO payments (booking_id, amount, payment_status, payment_method)
        VALUES (?, ?, ?, 'UPI')
      `);
      const pInfo = pStmt.run(bookingId, amount, status);
      const paymentId = Number(pInfo.lastInsertRowid);

      const uStmt = db.prepare(`
        INSERT INTO upi_payments (payment_id, upi_id, provider)
        VALUES (?, ?, ?)
      `);
      uStmt.run(paymentId, upiId, provider);

      return this.findUPIPaymentById(paymentId)!;
    });

    return transaction();
  }

  public findById(paymentId: number): Payment | null {
    const row = db.prepare(`
      SELECT payment_id as paymentId, booking_id as bookingId, amount,
             payment_status as paymentStatus, payment_method as paymentMethod,
             payment_date as paymentDate
      FROM payments WHERE payment_id = ?
    `).get(paymentId) as Payment | undefined;
    return row || null;
  }

  public findByBookingId(bookingId: number): Payment | null {
    const row = db.prepare(`
      SELECT payment_id as paymentId, booking_id as bookingId, amount,
             payment_status as paymentStatus, payment_method as paymentMethod,
             payment_date as paymentDate
      FROM payments WHERE booking_id = ?
    `).get(bookingId) as Payment | undefined;
    return row || null;
  }

  public findCardPaymentById(paymentId: number): CardPayment | null {
    const row = db.prepare(`
      SELECT p.payment_id as paymentId, p.booking_id as bookingId, p.amount,
             p.payment_status as paymentStatus, p.payment_method as paymentMethod,
             p.payment_date as paymentDate,
             c.card_number_masked as cardNumberMasked, c.card_type as cardType, c.bank_name as bankName
      FROM payments p
      JOIN card_payments c ON p.payment_id = c.payment_id
      WHERE p.payment_id = ?
    `).get(paymentId) as CardPayment | undefined;
    return row || null;
  }

  public findUPIPaymentById(paymentId: number): UPIPayment | null {
    const row = db.prepare(`
      SELECT p.payment_id as paymentId, p.booking_id as bookingId, p.amount,
             p.payment_status as paymentStatus, p.payment_method as paymentMethod,
             p.payment_date as paymentDate,
             u.upi_id as upiId, u.provider
      FROM payments p
      JOIN upi_payments u ON p.payment_id = u.payment_id
      WHERE p.payment_id = ?
    `).get(paymentId) as UPIPayment | undefined;
    return row || null;
  }

  public updateStatus(paymentId: number, status: PaymentStatus): boolean {
    const info = db.prepare('UPDATE payments SET payment_status = ? WHERE payment_id = ?').run(status, paymentId);
    return info.changes > 0;
  }

  public updateStatusByBookingId(bookingId: number, status: PaymentStatus): boolean {
    const info = db.prepare('UPDATE payments SET payment_status = ? WHERE booking_id = ?').run(status, bookingId);
    return info.changes > 0;
  }

  // Implementation of Payable interface
  public async processPayment(amount: number): Promise<{ success: boolean; transactionId: string; message: string }> {
    const txId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      success: true,
      transactionId: txId,
      message: 'Payment authorized successfully via simulated gateway',
    };
  }

  public async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('TXN-');
  }
}
