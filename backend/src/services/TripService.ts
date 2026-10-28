import { ScheduleRepository, ScheduleWithDetails } from '../repositories/ScheduleRepository';
import { RouteRepository } from '../repositories/RouteRepository';
import { TrainRepository } from '../repositories/TrainRepository';
import { BusRepository } from '../repositories/BusRepository';
import { ExternalScheduleAdapter } from '../adapters/ExternalScheduleAdapter';
import { NotFoundError } from '../utils/errors';

export class TripService {
  private scheduleRepo: ScheduleRepository;
  private routeRepo: RouteRepository;
  private trainRepo: TrainRepository;
  private busRepo: BusRepository;
  private externalAdapter: ExternalScheduleAdapter;

  constructor() {
    this.scheduleRepo = new ScheduleRepository();
    this.routeRepo = new RouteRepository();
    this.trainRepo = new TrainRepository();
    this.busRepo = new BusRepository();
    this.externalAdapter = new ExternalScheduleAdapter();
  }

  public searchTrips(params: {
    source: string;
    destination: string;
    journeyDate?: string;
    vehicleType?: 'Train' | 'Bus' | 'All';
  }): ScheduleWithDetails[] {
    const { source, destination, journeyDate, vehicleType } = params;
    let results = this.scheduleRepo.searchTrips(source || '', destination || '', journeyDate);

    if (vehicleType && vehicleType !== 'All') {
      results = results.filter((s) => s.vehicleType === vehicleType);
    }

    return results;
  }

  public getTripDetails(scheduleId: number): ScheduleWithDetails {
    const trip = this.scheduleRepo.findWithDetails(scheduleId);
    if (!trip) {
      throw new NotFoundError(`Trip with Schedule ID ${scheduleId} not found`);
    }
    return trip;
  }

  public getAllTrips(): ScheduleWithDetails[] {
    return this.scheduleRepo.findAllWithDetails();
  }

  public async syncExternalSchedules(source: string, destination: string) {
    const trains = await this.externalAdapter.fetchTrainSchedules(source, destination);
    const buses = await this.externalAdapter.fetchBusSchedules(source, destination);
    return { trains, buses };
  }
}
