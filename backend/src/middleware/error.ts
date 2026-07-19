import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error { constructor(public statusCode: number, message: string) { super(message); } }
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ZodError) { res.status(400).json({ message: 'Validation failed', issues: error.issues }); return; }
  if (error instanceof AppError) { res.status(error.statusCode).json({ message: error.message }); return; }
  console.error(error); res.status(500).json({ message: 'Internal server error' });
};
