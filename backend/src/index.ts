import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { config } from './lib/config';
import { initDB, pool } from './lib/db';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { setSocketIO } from './modules/messaging/service';
import { setRealtimeIO } from './lib/realtime';

// Routes
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import feedRoutes from './modules/feed/routes';
import rentalRoutes from './modules/rentals/routes';
import buddyRoutes from './modules/buddy/routes';
import forumRoutes from './modules/forums/routes';
import messageRoutes from './modules/messaging/routes';
import notificationRoutes from './modules/notifications/routes';
import reviewRoutes from './modules/reviews/routes';
import reportRoutes from './modules/reports/routes';
import uploadRoutes from './modules/uploads/routes';
import adminRoutes from './modules/admin/routes';
import transactionRoutes from './modules/transactions/routes';

async function main() {
  await initDB();

  const app = express();
  const httpServer = createServer(app);

  // Socket.IO
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
  });

  setSocketIO(io);
  setRealtimeIO(io);

  // Socket.IO auth
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, config.jwt.secret);
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId}`);
    socket.join(`user:${userId}`);

    // Forum rooms: clients ask to join "their" post/category by id; room names are
    // always built server-side with fixed prefixes, so a client can never join
    // someone else's private `user:` room this way.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const roomFor = (prefix: string) => (id: unknown) => {
      if (typeof id === 'string' && UUID_RE.test(id)) return `${prefix}:${id}`;
      return null;
    };
    socket.on('join_post', (id: unknown) => {
      const room = roomFor('post')(id);
      if (room) socket.join(room);
    });
    socket.on('leave_post', (id: unknown) => {
      const room = roomFor('post')(id);
      if (room) socket.leave(room);
    });
    socket.on('join_category', (id: unknown) => {
      const room = roomFor('category')(id);
      if (room) socket.join(room);
    });
    socket.on('leave_category', (id: unknown) => {
      const room = roomFor('category')(id);
      if (room) socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  // Trust proxy — required for express-rate-limit to read real client IP behind Render's reverse proxy
  app.set('trust proxy', 1);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api', limiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/rentals', rentalRoutes);
  app.use('/api/buddy', buddyRoutes);
  app.use('/api/forums', forumRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/uploads', uploadRoutes);

  // Error handler
  app.use(errorHandler);

  httpServer.listen(config.port, () => {
    console.log(`🚀 YELO API running on port ${config.port}`);
    console.log(`📡 WebSocket ready`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await pool.end();
  process.exit(0);
});
