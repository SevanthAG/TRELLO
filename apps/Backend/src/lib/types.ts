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