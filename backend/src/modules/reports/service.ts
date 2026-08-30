import { query } from '../../lib/db';
import { AppError } from '../../middleware/errorHandler';

const VALID_REPORT_TYPES = ['user', 'buddy_profile', 'listing', 'forum_post', 'comment', 'message'];
const VALID_REASONS = ['spam', 'harassment', 'fake_profile', 'scam', 'inappropriate', 'unsafe', 'other'];

export async function createReport(
  reporterId: string,
  reportType: string,
  targetId: string,
  reason: string,
  description?: string
) {
  // Validate inputs
  if (!VALID_REPORT_TYPES.includes(reportType)) {
    throw new AppError(400, 'Invalid report type');
  }
  if (!VALID_REASONS.includes(reason)) {
    throw new AppError(400, 'Invalid report reason');
  }

  // Prevent self-reporting
  if (reportType === 'user' && reporterId === targetId) {
    throw new AppError(400, 'Cannot report yourself');
  }

  // Check for duplicate recent report (within last hour)
  const recentReport = await query(
    `SELECT id FROM reports WHERE reporter_id = $1 AND target_id = $2 AND report_type = $3
     AND created_at > NOW() - INTERVAL '1 hour'`,
    [reporterId, targetId, reportType]
  );
  if (recentReport.rows.length > 0) {
    throw new AppError(429, 'You have already reported this recently');
  }

  const result = await query(
    `INSERT INTO reports (reporter_id, report_type, target_id, reason, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, report_type, reason, status, created_at`,
    [reporterId, reportType, targetId, reason, description || null]
  );
  return result.rows[0];
}

export async function getReports(status?: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  let queryStr = 'SELECT * FROM reports';
  const values: unknown[] = [];

  if (status) {
    queryStr += ' WHERE status = $1';
    values.push(status);
  }

  queryStr += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
  values.push(limit, offset);

  const result = await query(queryStr, values);
  return result.rows;
}

export async function resolveReport(reportId: string, adminNotes: string, status: string = 'resolved') {
  const result = await query(
    'UPDATE reports SET status = $1, admin_notes = $2, resolved_at = NOW() WHERE id = $3 RETURNING *',
    [status, adminNotes, reportId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Report not found');
  return result.rows[0];
}
