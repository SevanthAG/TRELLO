import { Router } from "express";
import bcrypt from "bcrypt";
import type { JwtUser } from "../lib/types";
import { prisma } from "db/client";
import jwt from "jsonwebtoken";

const authRoute = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}

authRoute.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required",
            });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            message: "Signup successful",
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                message: "User already exists",
            });
        }
        console.error(error);
        return res.status(500).json({
            message: "Error..!!",
        });
    }
});

authRoute.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const jwtPayload: JwtUser = {
            userId: user.id,
        }

        const token = jwt.sign(jwtPayload, JWT_SECRET!, {
            expiresIn: "7d",
        });

        return res.json({
            message: "Signin successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error..!!",
        });
    }
});

export default authRoute;