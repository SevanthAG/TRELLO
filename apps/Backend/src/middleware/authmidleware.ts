import { type NextFunction, type Request, type Response } from "express";
import  jwt  from "jsonwebtoken";
import type { JwtUser, Token } from "../lib/types";

export const authmiddleware = (req: Request, res: Response, next: NextFunction) => {
    const Authheader = req.headers.authorization;

    const token1: Token = req.cookies.token;
    console.log(token1);

    if(!token1){
        return res.status(401).json({
            message: "Token Missing..."
        })
    }

    try {
        const decoded = jwt.verify(token1,
            process.env.JWT_SECRET!
        ) as JwtUser
        console.log(decoded);
        
        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token or expired token."
        })
    }

    // Working Properly if i do Multiple Response It will throwing Error. 

    if(!Authheader || typeof Authheader !== "string") {
        return res.status(401).json({
            message:"Token Missing.."
        })
    }

    const token = Authheader.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message: "Token Missing..."
        })
    }

    try{
        const decoded = jwt.verify(token, 
            process.env.JWT_SECRET!
        ) as JwtUser
        
        req.userId = decoded.userId;

        next();
    }catch(err){
        return res.status(401).json({
            message: "Invalid token or expired token."
        })
    }
}