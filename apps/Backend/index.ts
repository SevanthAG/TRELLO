import { prisma } from "db/client";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());

// Health
app.get("/", (req, res) => {
  res.json({
    message: "Server Is running..",
  });
});

// Auth
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const userExist = await prisma.user.findFirst({
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

    const user = prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Signup successfull",
      user: {
        id: (await user).id,
        email: (await user).email,
      },
    });
  } catch (err) {
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

    const userExist = await prisma.user.findFirst({
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
      process.env.JWT_SECRET!,
    );

    return res.status(200).json({
      message: "Signin successful",
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
