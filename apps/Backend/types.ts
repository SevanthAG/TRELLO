export type JwtUser = {
  userId:number,
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}