import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Determine the Socket.IO server URL.
 *
 * Development: Vite proxies /socket.io to localhost:3001,
 *   so we connect to the same origin as the page.
 *
 * Production (Vercel + Render): the frontend and backend are on
 *   different domains, so we must connect directly to the backend.
 *   VITE_WS_URL is set in Vercel env vars to https://yelo-1.onrender.com.
 */
function getSocketUrl(): string {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) return wsUrl;
  // Fallback to same-origin (works with Vite proxy in dev)
  return window.location.origin;
}

/**
 * Get or create the singleton socket connection.
 * Authenticates with the current JWT token from localStorage.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No auth token — cannot connect socket');
  }

  // Disconnect existing socket if token changed or connection is stale
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const url = getSocketUrl();
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id, '→', url);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connection error:', err.message);
  });

  return socket;
}

/**
 * Disconnect the socket and clear the singleton.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance without creating a new one.
 * Returns null if not connected.
 */
export function getSocketIfConnected(): Socket | null {
  return socket?.connected ? socket : null;
}
