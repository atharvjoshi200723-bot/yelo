import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as reportService from './service';

export async function createReport(req: AuthRequest, res: Response) {
  const { reportType, targetId, reason, description } = req.body;
  if (!reportType || !targetId || !reason) {
    return res.status(400).json({ error: 'reportType, targetId, and reason are required' });
  }
  const report = await reportService.createReport(req.user!.id, reportType, targetId, reason, description);
  res.status(201).json({ report });
}

export async function getReports(req: AuthRequest, res: Response) {
  const status = req.query.status as string | undefined;
  const page = parseInt((req.query.page as string) || '1', 10);
  const reports = await reportService.getReports(status, page);
  res.json({ reports });
}

export async function resolveReport(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { adminNotes, status } = req.body;
  const report = await reportService.resolveReport(id, adminNotes || '', status);
  res.json({ report });
}
