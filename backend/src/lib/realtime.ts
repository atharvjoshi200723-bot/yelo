import { Server } from 'socket.io';

let io: Server | null = null;

export function setRealtimeIO(server: Server) {
  io = server;
}

export function getRealtimeIO() {
  return io;
}
