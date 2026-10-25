// websocket.ts
import { WebSocketServer } from "ws";
import type { Server } from "http";

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (socket) => {
        console.log("WebSocket client connected");

        socket.on("message", (message) => {
            console.log("Received:", message.toString());
        });

        socket.on("close", () => {
            console.log("Client disconnected");
        });
    });

    return wss;
}