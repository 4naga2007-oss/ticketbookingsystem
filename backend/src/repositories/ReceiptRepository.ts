import { db } from '../config/database';
import { Receipt } from '../types/domain';

export class ReceiptRepository {
  public create(
    bookingId: number,
    ticketNumber: string,
    generateDate: string,
    receiptData: Receipt['receiptData']
  ): Receipt {
    const stmt = db.prepare(`
      INSERT INTO receipts (booking_id, ticket_number, generate_date, receipt_data)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(bookingId, ticketNumber, generateDate, JSON.stringify(receiptData));
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(receiptId: number): Receipt | null {
    const row = db.prepare(`
      SELECT receipt_id as receiptId, booking_id as bookingId, ticket_number as ticketNumber,
             generate_date as generateDate, receipt_data as receiptDataJson
      FROM receipts WHERE receipt_id = ?
    `).get(receiptId) as any;

    if (!row) return null;

    return {
      receiptId: row.receiptId,
      bookingId: row.bookingId,
      ticketNumber: row.ticketNumber,
      generateDate: row.generateDate,
      receiptData: JSON.parse(row.receiptDataJson),
    };
  }

  public findByBookingId(bookingId: number): Receipt | null {
    const row = db.prepare(`
      SELECT receipt_id as receiptId, booking_id as bookingId, ticket_number as ticketNumber,
             generate_date as generateDate, receipt_data as receiptDataJson
      FROM receipts WHERE booking_id = ?
    `).get(bookingId) as any;

    if (!row) return null;

    return {
      receiptId: row.receiptId,
      bookingId: row.bookingId,
      ticketNumber: row.ticketNumber,
      generateDate: row.generateDate,
      receiptData: JSON.parse(row.receiptDataJson),
    };
  }

  public findByTicketNumber(ticketNumber: string): Receipt | null {
    const row = db.prepare(`
      SELECT receipt_id as receiptId, booking_id as bookingId, ticket_number as ticketNumber,
             generate_date as generateDate, receipt_data as receiptDataJson
      FROM receipts WHERE ticket_number = ?
    `).get(ticketNumber) as any;

    if (!row) return null;

    return {
      receiptId: row.receiptId,
      bookingId: row.bookingId,
      ticketNumber: row.ticketNumber,
      generateDate: row.generateDate,
      receiptData: JSON.parse(row.receiptDataJson),
    };
  }
}
