import express, { Application } from 'express';
import cors from 'cors';
import { rootRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', rootRouter);

  // Centralized Error Handler Middleware (must be after routes)
  app.use(errorHandler);

  return app;
}
