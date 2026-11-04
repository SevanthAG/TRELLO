import type { WsEvent } from "types/client";
import { create } from "zustand";

type Store = {
  socket: WebSocket | null;
  setSocket: () => boolean;
  wsSend: (msg: WsEvent) => void;
};

export const useSocketStore = create<Store>()((set, get) => ({
  socket: null,
  setSocket: () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return false;
    }

    const socket = new WebSocket(
      `ws://localhost:3000?token=${encodeURIComponent(token)}`,
    );

    set({ socket });
    return true;
  },
  wsSend: (msg: WsEvent) => {
    const { socket } = get();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Unable to send message.");
      return;
    }

    socket.send(JSON.stringify(msg));
  },
}));
