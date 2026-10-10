import { Router } from "express";
import { prisma } from "db/client";

const sectionRouter = Router();

sectionRouter.post("/:boardId", async (req, res) => {
  try {
    const userId = req.userId;
    const { boardId } = req.params;
    const { title } = req.body;

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
        organizationId: board.organizationId,
        userId: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not member of Organization",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not allowed",
      });
    }

    const newSection = await prisma.section.create({
      data: {
        boardId: boardId,
        title: title,
      },
    });

    return res.status(201).json({
      message: "Section Created Successfully",
      newSection,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

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

sectionRouter.patch("/:boardId/:sectionId", async (req, res) => {
  try {
    const userId = req.userId;
    const { boardId, sectionId } = req.params;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board Not Found",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        organizationId: board.organizationId,
        userId: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not member of Organization",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not allowed to modify",
      });
    }

    const existSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId
      },
    });

    if (!existSection) {
      return res.status(404).json({
        message: "Section Not Found",
      });
    }

    const updatedSection = await prisma.section.update({
      where: {
        id: sectionId,
        boardId: boardId,
      },
      data: {
        title: title,
      },
    });

    return res.status(200).json({
      message: "Section Updated",
      updatedSection,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

export default sectionRouter;