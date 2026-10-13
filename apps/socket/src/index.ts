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


  const requireBoardMember = async (boardId: string) => {
    if (!boardId) return { error: "boardId is required" };

    const board = await prisma.board.findFirst({ where: { id: boardId } });
    if (!board) return { error: "Board Not exist" };

    const membership = await prisma.membership.findFirst({
      where: {
        organizationId: board.organizationId,
        userId: socket.data.userId as string,
      },
    });
    if (!membership) return { error: "You are not member of Organization" };

    return { board, membership };
  };

  socket.on("section:list", async ({ boardId }, ack) => {
    if (typeof ack !== "function") return;
    try {
      const check = await requireBoardMember(boardId);
      if ("error" in check) return ack({ error: check.error });

      const sections = await prisma.section.findMany({ where: { boardId } });
      ack({ sections });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("section:create", async ({ boardId, title }, ack) => {
    if (typeof ack !== "function") return;
    try {
      if (!title?.trim()) return ack({ error: "Title is required" });

      const check = await requireBoardMember(boardId);
      if ("error" in check) return ack({ error: check.error });
      if (check.membership.role !== "ADMIN") {
        return ack({ error: "You are not allowed" });
      }

      const newSection = await prisma.section.create({
        data: { boardId, title: title.trim() },
      });

      io.to(boardId).emit("section:created", { section: newSection });
      ack({ section: newSection });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("issue:list", async ({ boardId }, ack) => {
    if (typeof ack !== "function") return;
    try {
      const check = await requireBoardMember(boardId);
      if ("error" in check) return ack({ error: check.error });

      const sections = await prisma.section.findMany({ where: { boardId } });
      const issues = await prisma.issue.findMany({
        where: { sectionId: { in: sections.map((s) => s.id) } },
      });
      ack({ issues });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("issue:create", async ({ sectionId, title, description }, ack) => {
    if (typeof ack !== "function") return;
    try {
      if (!title?.trim() || !description?.trim()) {
        return ack({ error: "title and description are required" });
      }

      const section = await prisma.section.findFirst({ where: { id: sectionId } });
      if (!section) return ack({ error: "Section Not Found" });

      const check = await requireBoardMember(section.boardId);
      if ("error" in check) return ack({ error: check.error });

      const newIssue = await prisma.issue.create({
        data: {
          sectionId,
          title: title.trim(),
          description: description.trim(),
        },
      });

      io.to(section.boardId).emit("issue:created", { issue: newIssue });
      ack({ issue: newIssue });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("section:update", async ({ boardId, sectionId, title }, ack) => {
    if (typeof ack !== "function") return;
    try {
      if (!title?.trim()) return ack({ error: "Title is required" });

      const check = await requireBoardMember(boardId);
      if ("error" in check) return ack({ error: check.error });
      if (check.membership.role !== "ADMIN") {
        return ack({ error: "You are not allowed to modify" });
      }

      const existSection = await prisma.section.findFirst({
        where: { id: sectionId, boardId },
      });
      if (!existSection) return ack({ error: "Section Not Found" });

      const updatedSection = await prisma.section.update({
        where: { id: sectionId },
        data: { title: title.trim() },
      });

      io.to(boardId).emit("section:updated", { section: updatedSection });
      ack({ section: updatedSection });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("issue:update", async ({ issueId, title, description }, ack) => {
    if (typeof ack !== "function") return;
    try {
      const trimmedTitle = title?.trim();
      const trimmedDescription = description?.trim();
      if (!trimmedTitle && !trimmedDescription) {
        return ack({ error: "Atleast one Field is required" });
      }

      const existIssue = await prisma.issue.findFirst({ where: { id: issueId } });
      if (!existIssue) return ack({ error: "Issue Not Found" });

      const section = await prisma.section.findFirst({
        where: { id: existIssue.sectionId },
      });
      if (!section) return ack({ error: "Section Not Found" });

      const check = await requireBoardMember(section.boardId);
      if ("error" in check) return ack({ error: check.error });

      const data: { title?: string; description?: string } = {};
      if (trimmedTitle) data.title = trimmedTitle;
      if (trimmedDescription) data.description = trimmedDescription;

      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data,
      });

      io.to(section.boardId).emit("issue:updated", { issue: updatedIssue });
      ack({ issue: updatedIssue });
    } catch (err) {
      console.log(err);
      ack({ error: "Internal server Error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("socket left:", socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`socket listening on ${port}`);
});
