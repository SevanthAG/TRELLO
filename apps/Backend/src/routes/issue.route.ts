import { Router } from "express";
import { prisma } from "db/client";

const issueRouter = Router();

issueRouter.get("/:sectionId", async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
      },
    });

    if (!section) {
      return res.status(404).json({
        message: "Section Not Found",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: section.boardId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board Not Found",
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
        message: "You are not member of Organization",
      });
    }

    const issues = await prisma.issue.findMany({
      where: {
        sectionId: sectionId,
      },
    });

    return res.status(200).json({
      message: "Issue fetched Succsfully",
      issues,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

issueRouter.get("/board/:boardId", async (req, res) => {
  try {
    const userId = req.userId;
    const { boardId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "unauthorized",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
      },
    });

    if (!board)
      return res.status(404).json({
        message: "Board Not Found",
      });

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: board.organizationId,
      },
    });
    if (!membership)
      return res.status(403).json({
        message: "You are not member of Organization",
      });

    const section = await prisma.section.findMany({
      where: {
        boardId: boardId,
      },
    });

    const issues = await prisma.issue.findMany({
      where: {
        sectionId: {
          in: section.map((section) => section.id),
        },
      },
    });
    return res.status(200).json({
      message: "Issue Fetched",
      issues,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

export default issueRouter;
