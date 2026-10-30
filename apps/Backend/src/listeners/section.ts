import { prisma } from "db/client";
import type { AuthenticatedWebSocket } from "../lib/types";
import { broadcastToBoard } from "./rooms";
import { Socket } from "node:dgram";

export const addSection = async (socket: AuthenticatedWebSocket, data: any) => {
  try {
    const userId = socket.userId;

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
        organizationId: board.organizationId,
        userId: userId,
      },
    });

    if (!membership) {
      return;
    }

    if (membership.role !== "ADMIN") {
      return;
    }

    const newSection = await prisma.section.create({
      data: {
        boardId: data.boardId,
        title: data.payload.title,
      },
    });

    broadcastToBoard(data.boardId, {
      type: "section_added",
      payload: newSection,
    });
  } catch (err) {
    console.log("In create Section..!!", err);
  }
};

export const delteSection = async (
  socket: AuthenticatedWebSocket,
  data: any,
) => {
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
      organizationId: board.organizationId,
      userId: socket.userId,
    },
  });

  if (!membership) {
    return;
  }

  if (membership.role != "ADMIN") {
    return;
  }

  const section = await prisma.section.findFirst({
    where: {
      id: data.payload.sectionId,
      boardId: data.boardId,
    },
  });

  if (!section) {
    return;
  }

  const deleteSection = await prisma.section.delete({
    where: {
      id: data.payload.sectionId,
    },
  });

  broadcastToBoard(data.boardId, {
    type: "section_deleted",
    payload: deleteSection,
  });
};
