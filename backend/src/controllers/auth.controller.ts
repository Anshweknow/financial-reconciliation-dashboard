import { Request, Response } from 'express';
import { authSchema } from '../validations/auth';
import * as authService from '../services/auth.service';
export const register = async (req: Request, res: Response) => { const { email, password } = authSchema.parse(req.body); res.status(201).json(await authService.register(email, password)); };
export const login = async (req: Request, res: Response) => { const { email, password } = authSchema.parse(req.body); res.json(await authService.login(email, password)); };
