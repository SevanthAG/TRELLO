import { prisma } from "db/client";
import { Router } from "express";

const boardRoute = Router();

boardRoute.post("/:orgId", async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.userId;
    const { orgId } = req.params;
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

    const organization = await prisma.organization.findUnique({
      where: {
        id: orgId,
      },
    });

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: orgId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message:
          "You do not have permission to create a board in this organization",
      });
    }

    const existingBoard = await prisma.board.findFirst({
      where: {
        organizationId: orgId,
        title: title,
      },
    });

    if (existingBoard) {
      return res.status(409).json({
        message: "A board with this title already exists in this organization",
      });
    }

    const newBoard = await prisma.board.create({
      data: {
        organizationId: orgId,
        title: title,
      },
    });

    return res.status(201).json({
      message: "Board created successfully",
      newBoard,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.get("/:orgId", async (req, res) => {
  try {
    const userId = req.userId;
    const { orgId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: orgId,
      },
    });

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: orgId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const boards = await prisma.board.findMany({
      where: {
        organizationId: orgId,
      },
    });

    return res.status(200).json({
      message: "Boards retrieved successfully",
      boards,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.patch("/:orgId/:boardId", async (req, res) => {
  try {
    const userId = req.userId;
    const { orgId, boardId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: orgId,
      },
    });

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        organizationId: orgId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message:
          "You do not have permission to update this board",
      });
    }

    const existBoard = await prisma.board.findFirst({
      where: {
        id: boardId,
        organizationId: orgId,
      },
    });

    if (!existBoard) {
      return res.status(404).json({
        message: "Board not exist",
      });
    }

    const updatedBoard = await prisma.board.update({
      where: {
        id: boardId,
      },
      data: {
        title: title,
      },
    });

    return res.status(200).json({
      message: "Board Updated",
      updatedBoard,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

export default boardRoute;