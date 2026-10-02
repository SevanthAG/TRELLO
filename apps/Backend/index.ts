import "dotenv/config";
import { prisma } from "db/client";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { JwtUser } from "./types";
import { authmiddleware } from "./authmidleware";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

app.get("/", (_req, res) => {
  res.json({ message: "Server is running." });
});

app.post("/signup", async (req, res) => {
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

app.post("/signin", async (req, res) => {
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

app.post('/organization', authmiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { orgName, description }  = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    }

    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: orgName
      }
    })

    if (existingOrg) {
      return res.status(401).json({
        message: "Organization ALready exist"
      })
    }
    const organization = await prisma.organization.create({
      data: {
        name: orgName,
        description: description,
        userId: userId
      }
    })

    return res.status(201).json({
      message: "Organization Created Successfully..",
      organization
    })
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error"
    })
  }
})

app.get("/organizations",authmiddleware, async (req, res)=>{
  try {

    const userId = req.userId;
    
    const organizations = await prisma.organization.findMany({
      where: {
        userId : userId
      }
    })
    
    return res.status(201).json({
    message: "Organization data Fetched",
    organizations
  })
  } catch(err) {
    console.log(err);
    return res.status(401).json({
      message: "Internal Server Error"
    })
}
})

app.listen(3000, () => {
  console.log("Server is running...");
});
