import { apiClient } from './api';
import type { ScheduleWithDetails, Booking, SeatAvailability, PassengerDetail } from '../types/domain';

export interface SearchParams {
  source: string;
  destination: string;
  journeyDate?: string;
  vehicleType?: 'Train' | 'Bus' | 'All';
}

export interface ReservePayload {
  scheduleId: number;
  passengerDetails: PassengerDetail[];
}

export const reservationApi = {
  search: (params: SearchParams) =>
    apiClient.get<{ success: boolean; count: number; data: ScheduleWithDetails[] }>('/reservation/search', {
      params: {
        source: params.source,
        destination: params.destination,
        journeyDate: params.journeyDate,
        vehicleType: params.vehicleType !== 'All' ? params.vehicleType : undefined,
      },
    }).then(r => r.data),

  getTripDetails: (scheduleId: number) =>
    apiClient.get<{ success: boolean; data: ScheduleWithDetails }>(`/reservation/trips/${scheduleId}`).then(r => r.data),

  getSeatAvailability: (scheduleId: number) =>
    apiClient.get<{ success: boolean; data: SeatAvailability }>(`/reservation/seats/availability/${scheduleId}`).then(r => r.data),

  reserve: (payload: ReservePayload) =>
    apiClient.post<{ success: boolean; data: Booking }>('/reservation/reserve', payload).then(r => r.data),

  getMyBookings: () =>
    apiClient.get<{ success: boolean; count: number; data: Booking[] }>('/reservation/bookings/my').then(r => r.data),

  getBooking: (bookingId: number) =>
    apiClient.get<{ success: boolean; data: Booking }>(`/reservation/bookings/${bookingId}`).then(r => r.data),

  cancelBooking: (bookingId: number) =>
    apiClient.post<{ success: boolean; message: string }>(`/reservation/bookings/${bookingId}/cancel`).then(r => r.data),
};
