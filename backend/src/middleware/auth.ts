import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new AppError(401, 'Missing bearer token');
  try { req.userId = (jwt.verify(token, env.JWT_SECRET) as { sub: string }).sub; next(); }
  catch { throw new AppError(401, 'Invalid or expired token'); }
};
