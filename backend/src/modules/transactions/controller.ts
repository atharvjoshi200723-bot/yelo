import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as txService from './service';

export async function getCommissionConfig(_req: AuthRequest, res: Response) {
  const config = await txService.getCommissionConfig();
  res.json({ config });
}

export async function calculateCommission(req: AuthRequest, res: Response) {
  const { amount } = req.body as { amount: number };
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
  const result = await txService.calculateCommission(amount);
  res.json(result);
}
