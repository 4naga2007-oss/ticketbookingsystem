import { db } from '../config/database';
import { Route } from '../types/domain';

export class RouteRepository {
  public create(source: string, destination: string, distance: number): Route {
    const stmt = db.prepare(`
      INSERT INTO routes (source, destination, distance)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(source, destination, distance);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(routeId: number): Route | null {
    const row = db.prepare(`
      SELECT route_id as routeId, source, destination, distance
      FROM routes WHERE route_id = ?
    `).get(routeId) as Route | undefined;
    return row || null;
  }

  public findBySourceAndDestination(source: string, destination: string): Route | null {
    const row = db.prepare(`
      SELECT route_id as routeId, source, destination, distance
      FROM routes WHERE LOWER(source) = LOWER(?) AND LOWER(destination) = LOWER(?)
    `).get(source, destination) as Route | undefined;
    return row || null;
  }

  public findAll(): Route[] {
    return db.prepare(`
      SELECT route_id as routeId, source, destination, distance
      FROM routes ORDER BY route_id ASC
    `).all() as Route[];
  }

  public update(routeId: number, source: string, destination: string, distance: number): boolean {
    const info = db.prepare(`
      UPDATE routes SET source = ?, destination = ?, distance = ?
      WHERE route_id = ?
    `).run(source, destination, distance, routeId);
    return info.changes > 0;
  }

  public delete(routeId: number): boolean {
    const info = db.prepare('DELETE FROM routes WHERE route_id = ?').run(routeId);
    return info.changes > 0;
  }
}
