import { Router } from "express";
import { prisma } from "db/client";

const sectionRouter = Router();

sectionRouter.get("/:boardId", async (req, res) => {
  try {
    const userId = req.userId;
    const { boardId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board Not exist",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: board.organizationId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const sections = await prisma.section.findMany({
      where: {
        boardId: boardId,
      },
    });

    return res.status(200).json({
      message: "Section fetched successfully",
      sections,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

export default sectionRouter;