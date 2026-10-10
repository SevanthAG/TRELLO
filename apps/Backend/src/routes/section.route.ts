import { Router } from "express";

const sectionRouter = Router()

boardRoute.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.query.boardId);
    const orgId = Number(req.query.orgId);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID",
      });
    }

    if (!Number.isInteger(orgId)) {
      return res.status(400).json({
        message: "Invalid organization ID",
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

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        organizationId: orgId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    return res.status(200).json({
      message: "Board retrieved successfully",
      board: board,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.post("/:boardId/sections", async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;
    const boardId = Number(req.params.boardId);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID",
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
      section: newSection,
    });
  } catch (err) {
    console.log("erroe while Creating Board");
  }
});

boardRoute.get("/:boardId/sections", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.params.boardId);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID",
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

    const sections = await prisma.section.findMany({
      where: {
        boardId: boardId,
      },
    });

    return res.status(200).json({
      message: "Board Fethed",
      sections: sections,
    });
  } catch (err) {
    console.log("Error while fecthing Sections", err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.post("/:boardId/sections/:sectionId/issue", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.params.boardId);
    const sectionId = Number(req.params.sectionId);
    const { title, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId) || !Number.isInteger(sectionId)) {
      return res.status(400).json({
        message: "Invalid board ID or sectionId",
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

    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId,
      },
    });

    if (!section) {
      return res.status(403).json({
        message: "Section Not Found",
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

    const newIssue = await prisma.issue.create({
      data: {
        title: title,
        description: description,
        sectionId: sectionId,
      },
    });

    return res.status(201).json({
      message: "Issue Created Succsfully",
      Issue: newIssue,
    });
  } catch (err) {
    console.log("Error while fecthing Sections", err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.get("/:boardId/sections/:sectionId/issues", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.params.boardId);
    const sectionId = Number(req.params.sectionId);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId) || !Number.isInteger(sectionId)) {
      return res.status(400).json({
        message: "Invalid board ID or sectionId",
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

    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId,
      },
    });

    if (!section) {
      return res.status(403).json({
        message: "Section Not Found",
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
      Issue: issues,
    });
  } catch (err) {
    console.log("Error while fecthing Sections", err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.get(
  "/:boardId/sections/:sectionId/issue/:issueId",
  async (req, res) => {
    try {
      const userId = req.userId;
      const boardId = Number(req.params.boardId);
      const sectionId = Number(req.params.sectionId);
      const issueId = Number(req.params.issueId);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (
        !Number.isInteger(boardId) ||
        !Number.isInteger(sectionId) ||
        !Number.isInteger(issueId)
      ) {
        return res.status(400).json({
          message: "Invalid board ID or sectionId",
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

      const section = await prisma.section.findFirst({
        where: {
          id: sectionId,
          boardId: boardId,
        },
      });

      if (!section) {
        return res.status(403).json({
          message: "Section Not Found",
        });
      }
      const issue = await prisma.issue.findFirst({
        where: {
          id: issueId,
          sectionId: sectionId,
        },
      });
      if (!issue) {
        return res.status(403).json({
          message: "Issue Not Found",
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

      return res.status(200).json({
        message: "issue fetched successfully",
        issue: issue,
      });
    } catch (err) {
      console.log("Error while fecthing issue", err);
      return res.status(500).json({
        message: "Internal server Error",
      });
    }
  },
);

boardRoute.put("/:boardId", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.params.boardId);
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID",
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

    const updatedBoard = await prisma.board.update({
      where: {
        id: boardId,
      },
      data: {
        title: title,
      },
    });

    return res.status(200).json({
      message: "board Updated",
      board: updatedBoard,
    });
  } catch (err) {
    console.log("Error while fecthing issue", err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

boardRoute.put(":boardId/sections/:sectionId", async (req, res) => {
  try {
    const userId = req.userId;
    const boardId = Number(req.params.boardId);
    const sectionId = Number(req.params.sectionId);
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(boardId) || !Number.isInteger(sectionId)) {
      return res.status(400).json({
        message: "Invalid board ID or SectionId",
      });
    }

    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId,
      },
    });

    if (!section) {
      return res.status(404).json({
        message: "Section Not exist",
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
        message: "You are not allowedto modify the Organization",
      });
    }

    const updatedSection = await prisma.section.update({
      where: {
        id: sectionId,
      },
      data: {
        title: title,
      },
    });

    return res.status(200).json({
      message: "Section Updated",
      sections: updatedSection,
    });
  } catch (err) {
    console.log("Error while fecthing Sections", err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

export default sectionRouter;