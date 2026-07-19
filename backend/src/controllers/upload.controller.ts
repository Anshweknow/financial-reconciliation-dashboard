import { Request, Response } from 'express';
import { AppError } from '../middleware/error';
import * as csvService from '../services/csv.service';
export const uploadOrders = async (req: Request, res: Response) => { if (!req.file || !req.userId) throw new AppError(400, 'orders.csv file is required'); res.status(201).json(await csvService.importOrders(req.userId, req.file.buffer)); };
export const uploadPayments = async (req: Request, res: Response) => { if (!req.file || !req.userId) throw new AppError(400, 'payments.csv file is required'); res.status(201).json(await csvService.importPayments(req.userId, req.file.buffer)); };
