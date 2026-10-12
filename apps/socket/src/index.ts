import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { prisma } from "db/client";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_ SECRET is not set");

const port = 8080;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Token Missing"));
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket Connected");

  socket.on("board:join", async ({ boardId }) => {
    if (!boardId) {
      return;
    }

    const userId = socket.data.userId as string;

    if (!userId) {
      return;
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      return;
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: board.organizationId,
      },
    });

    if (!membership) {
      return;
    }

    socket.join(boardId);
    console.log(`${socket.id} joined ${boardId}`);
  });


  socket.on("disconnect", () => {
    console.log("socket left:", socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`socket listening on ${port}`);
});
