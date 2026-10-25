import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "db/client";

const rooms = new Map<string, Set<WebSocket>>();

export function broadcast(boardId: string, event: unknown){
    const room = rooms.get(boardId);
    if(!room){
        return
    }

    const data = JSON.stringify(event);
    for(const socket of room){
        if(socket.readyState === WebSocket.OPEN){
            socket.send(data);
        }
    }
}
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });


  server.on("upgrade", async (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    const boardId = url.searchParams.get("boardId");

    if (!token || !boardId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
      return;
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      userId = decoded.userId;
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
      select: {
        organizationId: true,
      },
    });

    if (!board) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: board.organizationId,
      },
    });

    if (!membership) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const boardId = url.searchParams.get("boardId")!;

    if(!rooms.has(boardId)){
        rooms.set(boardId, new Set());
    }

    rooms.get(boardId)!.add(socket);

    socket.on("message", (message) => {
      console.log("Received:", message.toString());
      
    });

    socket.on("close", () => {
        const room = rooms.get(boardId);
        room?.delete(socket);
        if(room && room.size === 0){
            rooms.delete(boardId);
        }
        console.log("room", boardId, "size:", rooms.get(boardId)?.size ?? 0)
    });
  });

  return wss;
}
