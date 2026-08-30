import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

// Use absolute path to uploads directory relative to project root
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
for (const sub of ['profiles', 'buddy', 'posts']) {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1200; // max width/height in pixels
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, path.join(uploadDir, 'profiles'));
    } else if (file.fieldname === 'buddyImage') {
      cb(null, path.join(uploadDir, 'buddy'));
    } else {
      cb(null, path.join(uploadDir, 'posts'));
    }
  },
  filename: (_req, file, cb) => {
    // Save with original extension so compressImage can convert to .webp
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Compress and convert uploaded images to WebP
async function compressImage(inputPath: string, outputPath: string): Promise<void> {
  // Always write to a temporary file first to avoid input/output collision
  const tempPath = `${outputPath}.tmp`;

  try {
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    let pipeline = sharp(inputPath);

    // Resize if larger than max dimension, preserving aspect ratio
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Output as WebP with good quality to temp file
    await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(tempPath);

    // Move temp to final output
    fs.renameSync(tempPath, outputPath);

    // Remove original file if different from output
    if (inputPath !== outputPath) {
      try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
    }
  } catch (e) {
    // Clean up temp file on failure
    try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    throw e;
  }
}

const rawUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
    }
  },
});

// Wrapper that adds compression after multer processing
export const upload = {
  single(fieldName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      rawUpload.single(fieldName)(req, res, async (err) => {
        if (err || !req.file) {
          next(err);
          return;
        }
        try {
          const inputPath = req.file.path;
          const outputPath = inputPath.replace(/\.[^.]+$/, '.webp');

          // If input is already .webp (same path), just keep it as-is
          if (inputPath === outputPath) {
            next();
            return;
          }

          await compressImage(inputPath, outputPath);
          req.file.filename = path.basename(outputPath);
          req.file.path = outputPath;
          req.file.mimetype = 'image/webp';
          const stats = fs.statSync(outputPath);
          req.file.size = stats.size;
        } catch (compressErr) {
          console.error('Image compression failed, using original:', compressErr);
          // Continue with original file if compression fails
        }
        next();
      });
    };
  },
};
