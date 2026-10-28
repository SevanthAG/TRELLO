import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import type { AuthenticatedWebSocket, JwtUser } from "./lib/types";
import { addSection } from "./listeners/section";
import { parse } from "node:url";
import { joinRoom } from "./listeners/rooms";
import { createIssue } from "./listeners/issue";

export function setUpWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    const { query } = parse(req.url ?? "", true);
    const token = query.token;

    if (typeof token !== "string" || !token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;

      wss.handleUpgrade(req, socket, head, (ws) => {
        const authenticatedWs = ws as AuthenticatedWebSocket;
        authenticatedWs.userId = decoded.userId;

        wss.emit("connection", authenticatedWs, req);
      });
    } catch (err) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
  });

  wss.on("connection", (socket: AuthenticatedWebSocket) => {
    socket.on("message", (data) => {
      const parsedData = JSON.parse(data.toString());

      if(parsedData.type == "join_room"){
        joinRoom(parsedData.boardId, socket)
      }

      if(parsedData.type == "add_section"){
        addSection(socket, parsedData);
      }

      if(parsedData.type == "add_issue"){
        createIssue(socket, parsedData);
      }

    });
  });
}
