import { NotificationServiceAdapter, NotificationPayload } from '../adapters/NotificationServiceAdapter';

export class NotificationService {
  private adapter: NotificationServiceAdapter;

  constructor() {
    this.adapter = new NotificationServiceAdapter();
  }

  public async sendBookingConfirmation(email: string, bookingId: number, ticketNo: string, route: string): Promise<boolean> {
    return this.adapter.sendNotification({
      recipient: email,
      subject: `Booking Confirmed: Ticket #${ticketNo}`,
      message: `Your booking #${bookingId} for journey on ${route} is confirmed. Ticket: ${ticketNo}`,
      type: 'EMAIL',
    });
  }

  public async sendCancellationNotice(email: string, bookingId: number): Promise<boolean> {
    return this.adapter.sendNotification({
      recipient: email,
      subject: `Booking Cancelled: #${bookingId}`,
      message: `Your booking #${bookingId} has been successfully cancelled and refund initiated.`,
      type: 'EMAIL',
    });
  }

  public async sendScheduleUpdateNotice(email: string, scheduleInfo: string): Promise<boolean> {
    return this.adapter.sendNotification({
      recipient: email,
      subject: 'Schedule Update Notification',
      message: `Important update regarding your upcoming schedule: ${scheduleInfo}`,
      type: 'SMS',
    });
  }
}
