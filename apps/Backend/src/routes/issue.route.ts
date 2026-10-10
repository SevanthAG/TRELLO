
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