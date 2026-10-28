export interface NotificationPayload {
  recipient: string;
  subject: string;
  message: string;
  type: 'EMAIL' | 'SMS';
}

export class NotificationServiceAdapter {
  public async sendNotification(payload: NotificationPayload): Promise<boolean> {
    // Log simulation as requested for academic prototype
    console.log(`[Notification Service][${payload.type}] To: ${payload.recipient} | Subj: ${payload.subject} | Msg: ${payload.message}`);
    return true;
  }
}
