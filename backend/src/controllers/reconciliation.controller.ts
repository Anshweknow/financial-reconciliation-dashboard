import { ReconciliationStatus } from '@prisma/client';
import { Request, Response } from 'express';
import * as service from '../services/reconciliation.service';
export const run = async (req: Request, res: Response) => res.status(201).json(await service.runReconciliation(req.userId!));
export const results = async (req: Request, res: Response) => res.json(await service.getResults(req.userId!, req.query.status as ReconciliationStatus | undefined, req.query.search as string | undefined));
export const stats = async (req: Request, res: Response) => res.json(await service.getStats(req.userId!));
