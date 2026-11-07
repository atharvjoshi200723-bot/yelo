import { Server } from 'socket.io';

let io: Server | null = null;

export function setRealtimeIO(server: Server) {
  io = server;
}

export function getRealtimeIO() {
  return io;
}

/**
 * Broadcast an event to every connected client.
 *
 * Used for "new/changed item" notifications on the public lists (home feed,
 * rent, buddy) so an open page updates live instead of requiring a reload.
 * No-op when the realtime server isn't started (e.g. during tests).
 */
export function emitToAll(event: string, payload: unknown) {
  io?.emit(event, payload);
}

/**
 * Emit an event to a specific user's socket room.
 */
export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
