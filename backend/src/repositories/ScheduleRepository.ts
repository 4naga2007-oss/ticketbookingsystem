import { db } from '../config/database';
import { Schedule, Train, Bus, Route } from '../types/domain';
import { BadRequestError } from '../utils/errors';

export interface ScheduleWithDetails extends Schedule {
  route: Route;
  train?: Train;
  bus?: Bus;
  vehicleType: 'Train' | 'Bus';
  vehicleNameOrType: string;
  totalSeats: number;
  availableSeats: number;
}

export class ScheduleRepository {
  public create(
    routeId: number,
    departureTime: string,
    arrivalTime: string,
    journeyDate: string,
    fare: number,
    trainId?: number | null,
    busId?: number | null,
    status: 'Active' | 'Cancelled' | 'Completed' = 'Active'
  ): Schedule {
    // Strict constraint check
    const hasTrain = trainId !== undefined && trainId !== null;
    const hasBus = busId !== undefined && busId !== null;

    if ((hasTrain && hasBus) || (!hasTrain && !hasBus)) {
      throw new BadRequestError('A schedule must be assigned to either a Train OR a Bus, never both and never neither.');
    }

    const stmt = db.prepare(`
      INSERT INTO schedules (route_id, train_id, bus_id, departure_time, arrival_time, journey_date, fare, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      routeId,
      hasTrain ? trainId : null,
      hasBus ? busId : null,
      departureTime,
      arrivalTime,
      journeyDate,
      fare,
      status
    );

    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(scheduleId: number): Schedule | null {
    const row = db.prepare(`
      SELECT schedule_id as scheduleId, route_id as routeId, train_id as trainId, bus_id as busId,
             departure_time as departureTime, arrival_time as arrivalTime, journey_date as journeyDate,
             fare, status
      FROM schedules WHERE schedule_id = ?
    `).get(scheduleId) as Schedule | undefined;
    return row || null;
  }

  public findWithDetails(scheduleId: number): ScheduleWithDetails | null {
    const row = db.prepare(`
      SELECT s.schedule_id as scheduleId, s.route_id as routeId, s.train_id as trainId, s.bus_id as busId,
             s.departure_time as departureTime, s.arrival_time as arrivalTime, s.journey_date as journeyDate,
             s.fare, s.status,
             r.source, r.destination, r.distance,
             t.train_name as trainName, t.available_seats as trainAvailableSeats, t.total_seats as trainTotalSeats,
             b.bus_type as busType, b.available_seats as busAvailableSeats, b.total_seats as busTotalSeats
      FROM schedules s
      JOIN routes r ON s.route_id = r.route_id
      LEFT JOIN trains t ON s.train_id = t.train_id
      LEFT JOIN buses b ON s.bus_id = b.bus_id
      WHERE s.schedule_id = ?
    `).get(scheduleId) as any;

    if (!row) return null;

    const isTrain = row.trainId !== null;
    return {
      scheduleId: row.scheduleId,
      routeId: row.routeId,
      trainId: row.trainId,
      busId: row.busId,
      departureTime: row.departureTime,
      arrivalTime: row.arrivalTime,
      journeyDate: row.journeyDate,
      fare: row.fare,
      status: row.status,
      route: {
        routeId: row.routeId,
        source: row.source,
        destination: row.destination,
        distance: row.distance,
      },
      train: isTrain
        ? {
            trainId: row.trainId,
            trainName: row.trainName,
            availableSeats: row.trainAvailableSeats,
            totalSeats: row.trainTotalSeats,
          }
        : undefined,
      bus: !isTrain
        ? {
            busId: row.busId,
            busType: row.busType,
            availableSeats: row.busAvailableSeats,
            totalSeats: row.busTotalSeats,
          }
        : undefined,
      vehicleType: isTrain ? 'Train' : 'Bus',
      vehicleNameOrType: isTrain ? row.trainName : row.busType,
      totalSeats: isTrain ? row.trainTotalSeats : row.busTotalSeats,
      availableSeats: isTrain ? row.trainAvailableSeats : row.busAvailableSeats,
    };
  }

  public findAllWithDetails(): ScheduleWithDetails[] {
    const rows = db.prepare(`
      SELECT s.schedule_id as scheduleId, s.route_id as routeId, s.train_id as trainId, s.bus_id as busId,
             s.departure_time as departureTime, s.arrival_time as arrivalTime, s.journey_date as journeyDate,
             s.fare, s.status,
             r.source, r.destination, r.distance,
             t.train_name as trainName, t.available_seats as trainAvailableSeats, t.total_seats as trainTotalSeats,
             b.bus_type as busType, b.available_seats as busAvailableSeats, b.total_seats as busTotalSeats
      FROM schedules s
      JOIN routes r ON s.route_id = r.route_id
      LEFT JOIN trains t ON s.train_id = t.train_id
      LEFT JOIN buses b ON s.bus_id = b.bus_id
      ORDER BY s.journey_date ASC, s.departure_time ASC
    `).all() as any[];

    return rows.map((row) => {
      const isTrain = row.trainId !== null;
      return {
        scheduleId: row.scheduleId,
        routeId: row.routeId,
        trainId: row.trainId,
        busId: row.busId,
        departureTime: row.departureTime,
        arrivalTime: row.arrivalTime,
        journeyDate: row.journeyDate,
        fare: row.fare,
        status: row.status,
        route: {
          routeId: row.routeId,
          source: row.source,
          destination: row.destination,
          distance: row.distance,
        },
        train: isTrain
          ? {
              trainId: row.trainId,
              trainName: row.trainName,
              availableSeats: row.trainAvailableSeats,
              totalSeats: row.trainTotalSeats,
            }
          : undefined,
        bus: !isTrain
          ? {
              busId: row.busId,
              busType: row.busType,
              availableSeats: row.busAvailableSeats,
              totalSeats: row.busTotalSeats,
            }
          : undefined,
        vehicleType: isTrain ? 'Train' : 'Bus',
        vehicleNameOrType: isTrain ? row.trainName : row.busType,
        totalSeats: isTrain ? row.trainTotalSeats : row.busTotalSeats,
        availableSeats: isTrain ? row.trainAvailableSeats : row.busAvailableSeats,
      };
    });
  }

  public searchTrips(source: string, destination: string, journeyDate?: string): ScheduleWithDetails[] {
    let sql = `
      SELECT s.schedule_id as scheduleId, s.route_id as routeId, s.train_id as trainId, s.bus_id as busId,
             s.departure_time as departureTime, s.arrival_time as arrivalTime, s.journey_date as journeyDate,
             s.fare, s.status,
             r.source, r.destination, r.distance,
             t.train_name as trainName, t.available_seats as trainAvailableSeats, t.total_seats as trainTotalSeats,
             b.bus_type as busType, b.available_seats as busAvailableSeats, b.total_seats as busTotalSeats
      FROM schedules s
      JOIN routes r ON s.route_id = r.route_id
      LEFT JOIN trains t ON s.train_id = t.train_id
      LEFT JOIN buses b ON s.bus_id = b.bus_id
      WHERE LOWER(r.source) LIKE LOWER(?) AND LOWER(r.destination) LIKE LOWER(?) AND s.status = 'Active'
    `;
    const params: any[] = [`%${source}%`, `%${destination}%`];

    if (journeyDate) {
      const dateSql = sql + ` AND s.journey_date = ? ORDER BY s.departure_time ASC`;
      const dateRows = db.prepare(dateSql).all(...params, journeyDate) as any[];
      if (dateRows.length > 0) {
        return this.mapScheduleRows(dateRows);
      }
    }

    // Fallback: match by source and destination regardless of date so users always get trips
    sql += ` ORDER BY s.journey_date ASC, s.departure_time ASC`;
    const rows = db.prepare(sql).all(...params) as any[];
    return this.mapScheduleRows(rows);
  }

  private mapScheduleRows(rows: any[]): ScheduleWithDetails[] {
    return rows.map((row) => {
      const isTrain = row.trainId !== null;
      return {
        scheduleId: row.scheduleId,
        routeId: row.routeId,
        trainId: row.trainId,
        busId: row.busId,
        departureTime: row.departureTime,
        arrivalTime: row.arrivalTime,
        journeyDate: row.journeyDate,
        fare: row.fare,
        status: row.status,
        route: {
          routeId: row.routeId,
          source: row.source,
          destination: row.destination,
          distance: row.distance,
        },
        train: isTrain
          ? {
              trainId: row.trainId,
              trainName: row.trainName,
              availableSeats: row.trainAvailableSeats,
              totalSeats: row.trainTotalSeats,
            }
          : undefined,
        bus: !isTrain
          ? {
              busId: row.busId,
              busType: row.busType,
              availableSeats: row.busAvailableSeats,
              totalSeats: row.busTotalSeats,
            }
          : undefined,
        vehicleType: isTrain ? 'Train' : 'Bus',
        vehicleNameOrType: isTrain ? row.trainName : row.busType,
        totalSeats: isTrain ? row.trainTotalSeats : row.busTotalSeats,
        availableSeats: isTrain ? row.trainAvailableSeats : row.busAvailableSeats,
      };
    });
  }

  public update(
    scheduleId: number,
    routeId: number,
    departureTime: string,
    arrivalTime: string,
    journeyDate: string,
    fare: number,
    trainId?: number | null,
    busId?: number | null,
    status: 'Active' | 'Cancelled' | 'Completed' = 'Active'
  ): boolean {
    const hasTrain = trainId !== undefined && trainId !== null;
    const hasBus = busId !== undefined && busId !== null;

    if ((hasTrain && hasBus) || (!hasTrain && !hasBus)) {
      throw new BadRequestError('A schedule must be assigned to either a Train OR a Bus, never both and never neither.');
    }

    const info = db.prepare(`
      UPDATE schedules
      SET route_id = ?, train_id = ?, bus_id = ?, departure_time = ?, arrival_time = ?, journey_date = ?, fare = ?, status = ?
      WHERE schedule_id = ?
    `).run(
      routeId,
      hasTrain ? trainId : null,
      hasBus ? busId : null,
      departureTime,
      arrivalTime,
      journeyDate,
      fare,
      status,
      scheduleId
    );

    return info.changes > 0;
  }

  public updateStatus(scheduleId: number, status: 'Active' | 'Cancelled' | 'Completed'): boolean {
    const info = db.prepare('UPDATE schedules SET status = ? WHERE schedule_id = ?').run(status, scheduleId);
    return info.changes > 0;
  }

  public delete(scheduleId: number): boolean {
    const info = db.prepare('DELETE FROM schedules WHERE schedule_id = ?').run(scheduleId);
    return info.changes > 0;
  }
}
