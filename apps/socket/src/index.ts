import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { prisma } from "db/client";
import { deleteIssue, deleteSection, moveIssue } from "./lib/board-operations";

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
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "string" ||
      !decoded.userId
    ) {
      return next(new Error("Invalid token"));
    }
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket Connected");

  socket.on(
    "board:join",
    async (
      payload,
      ack?: (response: { error?: string; joined?: boolean }) => void,
    ) => {
      const boardId =
        typeof payload === "object" && payload !== null && "boardId" in payload
          ? payload.boardId
          : undefined;
      if (typeof boardId !== "string" || !boardId) {
        ack?.({ error: "boardId is required" });
        return;
      }

      const userId = socket.data.userId as string;

      if (!userId) {
        ack?.({ error: "Unauthorized" });
        return;
      }

      try {
        const board = await prisma.board.findUnique({
          where: { id: boardId },
          select: { organizationId: true },
        });
        if (!board) {
          ack?.({ error: "Board not found" });
          return;
        }

        const membership = await prisma.membership.findFirst({
          where: { userId, organizationId: board.organizationId },
        });
        if (!membership) {
          ack?.({ error: "You are not a member of this organization" });
          return;
        }

        const previousBoardId = socket.data.boardId as string | undefined;
        if (previousBoardId && previousBoardId !== boardId) {
          await socket.leave(previousBoardId);
        }
        await socket.join(boardId);
        socket.data.boardId = boardId;
        ack?.({ joined: true });
      } catch (error) {
        console.error("Failed to join board room", error);
        ack?.({ error: "Could not join board" });
        return;
      }
      console.log(`${socket.id} joined ${boardId}`);
    },
  );

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

      const section = await prisma.section.findFirst({
        where: { id: sectionId },
      });
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

      const existIssue = await prisma.issue.findFirst({
        where: { id: issueId },
      });
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

  socket.on("issue:move", async (payload, ack) => {
    if (typeof ack !== "function") return;
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("boardId" in payload) ||
      !("issueId" in payload) ||
      !("sourceSectionId" in payload) ||
      !("destinationSectionId" in payload) ||
      typeof payload.boardId !== "string" ||
      typeof payload.issueId !== "string" ||
      typeof payload.sourceSectionId !== "string" ||
      typeof payload.destinationSectionId !== "string" ||
      !payload.boardId ||
      !payload.issueId ||
      !payload.sourceSectionId ||
      !payload.destinationSectionId
    ) {
      return ack({ error: "Invalid issue move payload" });
    }
    if (!socket.rooms.has(payload.boardId)) {
      return ack({ error: "Join this board before moving issues" });
    }

    try {
      const result = await moveIssue({
        userId: socket.data.userId as string,
        boardId: payload.boardId,
        issueId: payload.issueId,
        sourceSectionId: payload.sourceSectionId,
        destinationSectionId: payload.destinationSectionId,
      });
      if (!result.ok) return ack({ error: result.error });

      io.to(payload.boardId).emit("issue:moved", {
        boardId: payload.boardId,
        sourceSectionId: payload.sourceSectionId,
        destinationSectionId: payload.destinationSectionId,
        issue: result.value.issue,
      });
      return ack({ issue: result.value.issue });
    } catch (error) {
      console.error("Failed to move issue", error);
      return ack({ error: "Could not move issue" });
    }
  });

  socket.on("issue:delete", async (payload, ack) => {
    if (typeof ack !== "function") return;
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("boardId" in payload) ||
      !("issueId" in payload) ||
      typeof payload.boardId !== "string" ||
      typeof payload.issueId !== "string" ||
      !payload.boardId ||
      !payload.issueId
    ) {
      return ack({ error: "Invalid issue delete payload" });
    }
    if (!socket.rooms.has(payload.boardId)) {
      return ack({ error: "Join this board before deleting issues" });
    }

    try {
      const result = await deleteIssue({
        userId: socket.data.userId as string,
        boardId: payload.boardId,
        issueId: payload.issueId,
      });
      if (!result.ok) return ack({ error: result.error });

      io.to(payload.boardId).emit("issue:deleted", {
        boardId: payload.boardId,
        issueId: result.value.issueId,
      });
      return ack({ issueId: result.value.issueId });
    } catch (error) {
      console.error("Failed to delete issue", error);
      return ack({ error: "Could not delete issue" });
    }
  });

  socket.on("section:delete", async (payload, ack) => {
    if (typeof ack !== "function") return;
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("boardId" in payload) ||
      !("sectionId" in payload) ||
      typeof payload.boardId !== "string" ||
      typeof payload.sectionId !== "string" ||
      !payload.boardId ||
      !payload.sectionId
    ) {
      return ack({ error: "Invalid section delete payload" });
    }
    if (!socket.rooms.has(payload.boardId)) {
      return ack({ error: "Join this board before deleting sections" });
    }

    try {
      const result = await deleteSection({
        userId: socket.data.userId as string,
        boardId: payload.boardId,
        sectionId: payload.sectionId,
      });
      if (!result.ok) return ack({ error: result.error });

      io.to(result.value.boardId).emit("section:deleted", result.value);
      return ack(result.value);
    } catch (error) {
      console.error("Failed to delete section", error);
      return ack({ error: "Could not delete section" });
    }
  });

  socket.on("disconnect", () => {
    console.log("socket left:", socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`socket listening on ${port}`);
});
