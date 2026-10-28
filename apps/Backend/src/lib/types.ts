import WebSocket from "ws";

export type JwtUser = {
  userId:string,
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}