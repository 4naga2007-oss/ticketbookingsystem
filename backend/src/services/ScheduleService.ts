import { ScheduleRepository, ScheduleWithDetails } from '../repositories/ScheduleRepository';
import { RouteRepository } from '../repositories/RouteRepository';
import { TrainRepository } from '../repositories/TrainRepository';
import { BusRepository } from '../repositories/BusRepository';
import { Schedule, Route, Train, Bus } from '../types/domain';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class ScheduleService {
  private scheduleRepo: ScheduleRepository;
  private routeRepo: RouteRepository;
  private trainRepo: TrainRepository;
  private busRepo: BusRepository;

  constructor() {
    this.scheduleRepo = new ScheduleRepository();
    this.routeRepo = new RouteRepository();
    this.trainRepo = new TrainRepository();
    this.busRepo = new BusRepository();
  }

  // ==========================
  // Schedule Operations
  // ==========================

  public createSchedule(data: {
    routeId: number;
    departureTime: string;
    arrivalTime: string;
    journeyDate: string;
    fare: number;
    trainId?: number | null;
    busId?: number | null;
  }): Schedule {
    const { routeId, departureTime, arrivalTime, journeyDate, fare, trainId, busId } = data;

    if (!routeId || !departureTime || !arrivalTime || !journeyDate || fare <= 0) {
      throw new BadRequestError('routeId, departureTime, arrivalTime, journeyDate, and positive fare are required');
    }

    const hasTrain = trainId !== undefined && trainId !== null && trainId > 0;
    const hasBus = busId !== undefined && busId !== null && busId > 0;

    if ((hasTrain && hasBus) || (!hasTrain && !hasBus)) {
      throw new BadRequestError('A schedule must be assigned to either a Train OR a Bus, never both and never neither.');
    }

    const route = this.routeRepo.findById(routeId);
    if (!route) {
      throw new NotFoundError(`Route ID ${routeId} does not exist`);
    }

    if (hasTrain) {
      const train = this.trainRepo.findById(trainId!);
      if (!train) throw new NotFoundError(`Train ID ${trainId} does not exist`);
    }

    if (hasBus) {
      const bus = this.busRepo.findById(busId!);
      if (!bus) throw new NotFoundError(`Bus ID ${busId} does not exist`);
    }

    return this.scheduleRepo.create(
      routeId,
      departureTime,
      arrivalTime,
      journeyDate,
      fare,
      hasTrain ? trainId : null,
      hasBus ? busId : null,
      'Active'
    );
  }

  public getAllSchedules(): ScheduleWithDetails[] {
    return this.scheduleRepo.findAllWithDetails();
  }

  public getScheduleById(scheduleId: number): ScheduleWithDetails {
    const schedule = this.scheduleRepo.findWithDetails(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule ID ${scheduleId} not found`);
    }
    return schedule;
  }

  public updateSchedule(
    scheduleId: number,
    data: Partial<{
      routeId: number;
      departureTime: string;
      arrivalTime: string;
      journeyDate: string;
      fare: number;
      trainId: number | null;
      busId: number | null;
      status: 'Active' | 'Cancelled' | 'Completed';
    }>
  ): boolean {
    const existing = this.scheduleRepo.findById(scheduleId);
    if (!existing) {
      throw new NotFoundError(`Schedule ID ${scheduleId} not found`);
    }

    // Merge incoming partial data onto existing record (PATCH semantics)
    const merged = {
      routeId:       data.routeId       ?? existing.routeId,
      departureTime: data.departureTime ?? existing.departureTime,
      arrivalTime:   data.arrivalTime   ?? existing.arrivalTime,
      journeyDate:   data.journeyDate   ?? existing.journeyDate,
      fare:          data.fare          ?? existing.fare,
      trainId:       'trainId' in data  ? data.trainId : existing.trainId,
      busId:         'busId'   in data  ? data.busId   : existing.busId,
      status:        data.status        ?? (existing.status as 'Active' | 'Cancelled' | 'Completed') ?? 'Active',
    };

    const hasTrain = merged.trainId !== undefined && merged.trainId !== null && merged.trainId > 0;
    const hasBus   = merged.busId   !== undefined && merged.busId   !== null && merged.busId   > 0;

    if ((hasTrain && hasBus) || (!hasTrain && !hasBus)) {
      throw new BadRequestError('A schedule must be assigned to either a Train OR a Bus, never both and never neither.');
    }

    return this.scheduleRepo.update(
      scheduleId,
      merged.routeId,
      merged.departureTime,
      merged.arrivalTime,
      merged.journeyDate,
      merged.fare,
      hasTrain ? merged.trainId : null,
      hasBus   ? merged.busId   : null,
      merged.status
    );
  }

  public deleteSchedule(scheduleId: number): boolean {
    const existing = this.scheduleRepo.findById(scheduleId);
    if (!existing) {
      throw new NotFoundError(`Schedule ID ${scheduleId} not found`);
    }
    return this.scheduleRepo.delete(scheduleId);
  }

  // ==========================
  // Route Operations
  // ==========================

  public createRoute(source: string, destination: string, distance: number): Route {
    if (!source || !destination || distance <= 0) {
      throw new BadRequestError('Source, destination and positive distance are required');
    }
    return this.routeRepo.create(source, destination, distance);
  }

  public getAllRoutes(): Route[] {
    return this.routeRepo.findAll();
  }

  public getRouteById(routeId: number): Route {
    const route = this.routeRepo.findById(routeId);
    if (!route) throw new NotFoundError(`Route ID ${routeId} not found`);
    return route;
  }

  public updateRoute(routeId: number, source: string, destination: string, distance: number): boolean {
    const existing = this.routeRepo.findById(routeId);
    if (!existing) throw new NotFoundError(`Route ID ${routeId} not found`);
    return this.routeRepo.update(routeId, source, destination, distance);
  }

  public deleteRoute(routeId: number): boolean {
    const existing = this.routeRepo.findById(routeId);
    if (!existing) throw new NotFoundError(`Route ID ${routeId} not found`);
    return this.routeRepo.delete(routeId);
  }

  // ==========================
  // Vehicle Operations (Train & Bus)
  // ==========================

  public getAllTrains(): Train[] {
    return this.trainRepo.findAll();
  }

  public createTrain(trainName: string, totalSeats: number): Train {
    if (!trainName || totalSeats <= 0) {
      throw new BadRequestError('Train name and positive seat capacity are required');
    }
    return this.trainRepo.create(trainName, totalSeats);
  }

  public getAllBuses(): Bus[] {
    return this.busRepo.findAll();
  }

  public createBus(busType: string, totalSeats: number): Bus {
    if (!busType || totalSeats <= 0) {
      throw new BadRequestError('Bus type and positive seat capacity are required');
    }
    return this.busRepo.create(busType, totalSeats);
  }
}
