import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadLimiter } from '../../middleware/rateLimit';
import { upload } from '../../lib/upload';

const router = Router();

/**
 * Shared image upload for post, linkup, rent listing and forum composers.
 * Accepts up to 5 images under the "images" field, compresses each to WebP
 * and returns public paths like "/uploads/posts/<uuid>.webp".
 */
router.post('/', authenticate, uploadLimiter, upload.array('images', 5), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }
  // Unknown field names land in the posts/ directory (see lib/upload.ts)
  const urls = files.map(file => `/uploads/posts/${file.filename}`);
  return res.status(201).json({ urls });
});

export default router;
