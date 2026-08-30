import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

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

  // Disconnect existing socket if token changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Connect to the backend — in dev, Vite proxies /socket.io to localhost:3001
  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
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
