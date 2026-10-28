export interface ExternalTransitSchedule {
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  fare: number;
  vehicleType: 'Train' | 'Bus';
  vehicleNameOrType: string;
  seats: number;
}

export class ExternalScheduleAdapter {
  /**
   * Mock sync with external Train schedule feed
   */
  public async fetchTrainSchedules(source: string, destination: string): Promise<ExternalTransitSchedule[]> {
    return [
      {
        source,
        destination,
        departureTime: '06:00 AM',
        arrivalTime: '10:30 AM',
        journeyDate: '2026-10-15',
        fare: 650.0,
        vehicleType: 'Train',
        vehicleNameOrType: 'Vande Bharat Express',
        seats: 50,
      },
    ];
  }

  /**
   * Mock sync with external Bus schedule feed
   */
  public async fetchBusSchedules(source: string, destination: string): Promise<ExternalTransitSchedule[]> {
    return [
      {
        source,
        destination,
        departureTime: '21:00 PM',
        arrivalTime: '05:30 AM',
        journeyDate: '2026-10-15',
        fare: 850.0,
        vehicleType: 'Bus',
        vehicleNameOrType: 'KPN Sleeper Class',
        seats: 36,
      },
    ];
  }
}
