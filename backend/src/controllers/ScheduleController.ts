import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/ScheduleService';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  // Schedule Endpoints
  public getAllSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = this.scheduleService.getAllSchedules();
      res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
      next(error);
    }
  };

  public getScheduleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const schedule = this.scheduleService.getScheduleById(id);
      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { routeId, departureTime, arrivalTime, journeyDate, fare, trainId, busId } = req.body;
      const created = this.scheduleService.createSchedule({
        routeId: Number(routeId),
        departureTime,
        arrivalTime,
        journeyDate,
        fare: Number(fare),
        trainId: trainId ? Number(trainId) : null,
        busId: busId ? Number(busId) : null,
      });
      res.status(201).json({ success: true, message: 'Schedule created successfully', data: created });
    } catch (error) {
      next(error);
    }
  };

  public updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const body = req.body;

      // Build a partial patch object — only include fields that were actually sent
      const patch: Record<string, unknown> = {};
      if (body.routeId       !== undefined) patch.routeId       = Number(body.routeId);
      if (body.departureTime !== undefined) patch.departureTime = body.departureTime;
      if (body.arrivalTime   !== undefined) patch.arrivalTime   = body.arrivalTime;
      if (body.journeyDate   !== undefined) patch.journeyDate   = body.journeyDate;
      if (body.fare          !== undefined) patch.fare          = Number(body.fare);
      if (body.status        !== undefined) patch.status        = body.status;
      // trainId / busId: explicitly passed null means "remove", omitted means "keep existing"
      if ('trainId' in body) patch.trainId = body.trainId ? Number(body.trainId) : null;
      if ('busId'   in body) patch.busId   = body.busId   ? Number(body.busId)   : null;

      this.scheduleService.updateSchedule(id, patch);
      res.status(200).json({ success: true, message: 'Schedule updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      this.scheduleService.deleteSchedule(id);
      res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Route Endpoints
  public getAllRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const routes = this.scheduleService.getAllRoutes();
      res.status(200).json({ success: true, count: routes.length, data: routes });
    } catch (error) {
      next(error);
    }
  };

  public createRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { source, destination, distance } = req.body;
      const created = this.scheduleService.createRoute(source, destination, Number(distance));
      res.status(201).json({ success: true, message: 'Route created successfully', data: created });
    } catch (error) {
      next(error);
    }
  };

  // Vehicle Endpoints
  public getAllTrains = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trains = this.scheduleService.getAllTrains();
      res.status(200).json({ success: true, count: trains.length, data: trains });
    } catch (error) {
      next(error);
    }
  };

  public createTrain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trainName, totalSeats } = req.body;
      const created = this.scheduleService.createTrain(trainName, Number(totalSeats));
      res.status(201).json({ success: true, message: 'Train created successfully', data: created });
    } catch (error) {
      next(error);
    }
  };

  public getAllBuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buses = this.scheduleService.getAllBuses();
      res.status(200).json({ success: true, count: buses.length, data: buses });
    } catch (error) {
      next(error);
    }
  };

  public createBus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { busType, totalSeats } = req.body;
      const created = this.scheduleService.createBus(busType, Number(totalSeats));
      res.status(201).json({ success: true, message: 'Bus created successfully', data: created });
    } catch (error) {
      next(error);
    }
  };
}
