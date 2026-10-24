import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Error:', err.message);
  console.error('   Stack:', err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Handle Zod validation errors with field-level details
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.');
      fields[field] = issue.message;
    }
    return res.status(400).json({
      error: 'Please fix the highlighted fields.',
      code: 'VALIDATION_ERROR',
      fields,
    });
  }

  // Return the actual error message in development
  return res.status(500).json({
    error: err.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}
