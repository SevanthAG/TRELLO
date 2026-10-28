import { prisma } from "db/client";
import type { AuthenticatedWebSocket } from "../lib/types";

export const wsSectionOperation = async (
  socket: AuthenticatedWebSocket,
  data: any,
) => {
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

    socket.send(
      JSON.stringify({
        type: "section_added",
        payload: newSection,
      }),
    );
  } catch (err) {
    console.log("In create Section..!!", err);
  }
};
