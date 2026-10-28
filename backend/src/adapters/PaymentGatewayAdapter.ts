export interface CardPaymentRequest {
  cardNumber: string;
  cardType: string;
  bankName: string;
  expiry: string;
  amount: number;
}

export interface UPIPaymentRequest {
  upiId: string;
  provider: string;
  amount: number;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId: string;
  authorizationCode: string;
  timestamp: string;
  message: string;
}

export class PaymentGatewayAdapter {
  /**
   * Process simulated card payment without persisting sensitive card credentials
   */
  public async processCardPayment(req: CardPaymentRequest): Promise<PaymentGatewayResponse> {
    // Academic simulation: check non-empty card number and positive amount
    if (!req.cardNumber || req.amount <= 0) {
      return {
        success: false,
        transactionId: '',
        authorizationCode: '',
        timestamp: new Date().toISOString(),
        message: 'Invalid card details or invalid transaction amount',
      };
    }

    const txId = `CARD-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const authCode = `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      transactionId: txId,
      authorizationCode: authCode,
      timestamp: new Date().toISOString(),
      message: `Card transaction authorized successfully with ${req.bankName}`,
    };
  }

  /**
   * Process simulated UPI payment
   */
  public async processUPIPayment(req: UPIPaymentRequest): Promise<PaymentGatewayResponse> {
    if (!req.upiId || !req.upiId.includes('@') || req.amount <= 0) {
      return {
        success: false,
        transactionId: '',
        authorizationCode: '',
        timestamp: new Date().toISOString(),
        message: 'Invalid UPI ID format or invalid amount',
      };
    }

    const txId = `UPI-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const authCode = `UPI-AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      transactionId: txId,
      authorizationCode: authCode,
      timestamp: new Date().toISOString(),
      message: `UPI payment processed via ${req.provider}`,
    };
  }
}
