import "dotenv/config";
import { prisma } from "db/client";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Health
app.get("/", (req, res) => {
  res.json({
    message: "Server Is running..",
  });
});

// Auth
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required",
      });
    }

    const userExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (userExist) {
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
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    console.log(err);
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

    const userExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!userExist) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userExist.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: userExist.id,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Signin successful",
      user: {
        id: userExist.id,
        username: userExist.username,
        email: userExist.email,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error..!!",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running...");
});
