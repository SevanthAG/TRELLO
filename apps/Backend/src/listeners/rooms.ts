import type { AuthenticatedWebSocket } from "../lib/types";

const rooms = new Map<String, Set<AuthenticatedWebSocket>>();

export const joinRoom = async (
  boardId: string,
  socket: AuthenticatedWebSocket,
) => {
  let room = rooms.get(boardId);

  if (!room) {
    room = new Set();
    rooms.set(boardId, room);
  }

  room.add(socket);
};

export const broadcastToBoard = async (boardId: string, message: unknown) => {
  const room = rooms.get(boardId);

  if (!room) {
    return;
  }

  const payload = JSON.stringify(message);

  for (const socket of room) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
};
