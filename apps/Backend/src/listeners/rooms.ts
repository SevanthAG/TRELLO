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
