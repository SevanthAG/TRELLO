import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoute from "./routes/auth.route";
import orgRoute from "./routes/organization.route";
import { authmiddleware } from "./middleware/authmidleware";
import memberRoute from "./routes/members.routes";
import boardRoute from "./routes/boards.route";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://blockboard-psi.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running." });
});

app.use("/api/auth", authRoute);
app.use("/api/organization",authmiddleware, orgRoute);
app.use("/api/member", authmiddleware, memberRoute)
app.use("/api/board", authmiddleware, boardRoute);


const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});