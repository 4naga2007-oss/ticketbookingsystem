import { apiClient } from './api';
import type { Payment, CardPayment, UPIPayment, Receipt } from '../types/domain';

export interface CardPaymentPayload {
  bookingId: number;
  amount: number;
  cardNumber: string;
  cardType: string;
  bankName: string;
  expiry: string;
  cardHolderName: string;
}

export interface UPIPaymentPayload {
  bookingId: number;
  amount: number;
  upiId: string;
  provider: string;
}

export interface PaymentResult<T extends Payment> {
  success: boolean;
  data: {
    payment: T;
    receipt: Receipt;
    booking: { bookingId: number; bookingStatus: string };
  };
}

export const paymentApi = {
  processCard: (payload: CardPaymentPayload) =>
    apiClient.post<PaymentResult<CardPayment>>('/payment/process/card', payload).then(r => r.data),

  processUPI: (payload: UPIPaymentPayload) =>
    apiClient.post<PaymentResult<UPIPayment>>('/payment/process/upi', payload).then(r => r.data),

  getReceipt: (bookingId: number) =>
    apiClient.get<{ success: boolean; data: { payment: Payment; receipt: Receipt; booking: object } }>(
      `/payment/receipt/${bookingId}`
    ).then(r => r.data),

  getPaymentDetails: (bookingId: number) =>
    apiClient.get<{ success: boolean; data: Payment }>(`/payment/details/${bookingId}`).then(r => r.data),
};
