import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtUser } from "../lib/types";

export const authmiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token: string | undefined = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "Token Missing...",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token or expired token.",
    });
  }
};
