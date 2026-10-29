import { prisma } from "db/client";
import type { AuthenticatedWebSocket } from "../lib/types";
import { broadcastToBoard } from "./rooms";

export const createIssue = async (
  socket: AuthenticatedWebSocket,
  data: any,
) => {
  const section = await prisma.section.findFirst({
    where: {
      id: data.payload.sectionId,
    },
  });

  if (!section) {
    return;
  }

  const board = await prisma.board.findFirst({
    where: {
      id: data.boardId,
    },
  });

  if (!board) {
    return;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: socket.userId,
      organizationId: board.organizationId,
    },
  });

  if (!membership) {
    return;
  }

  const newIssue = await prisma.issue.create({
    data: {
      sectionId: data.payload.sectionId,
      title: data.payload.title,
      description: data.payload.description,
    },
  });
  broadcastToBoard(data.boardId, {
    type: "Issue_Added",
    payload: newIssue,
  });
};

export const deleteIssue = async (
  socket: AuthenticatedWebSocket,
  data: any,
) => {
  const section = await prisma.section.findFirst({
    where: {
      id: data.payload.sectionId,
      boardId: data.boardId,
    },
  });

  if (!section) {
    return;
  }

  const board = await prisma.board.findFirst({
    where: {
      id: data.boardId,
    },
  });

  if (!board) {
    return;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: socket.userId,
      organizationId: board.organizationId,
    },
  });

  if (!membership) {
    return;
  }

  const issue = await prisma.issue.findFirst({
    where: {
      id: data.payload.issueId,
      sectionId: section.id,
    },
  });

  if (!issue) {
    return;
  }

  const deleteIssue = await prisma.issue.delete({
    where: {
      id: issue.id,
    },
  });

  broadcastToBoard(data.boardId, {
    type: "issue_deleted",
    payload: deleteIssue,
  });
};
