import { Router } from "express";
import { prisma } from "db/client";

const issueRouter = Router();

issueRouter.post("/:sectionId", async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionId } = req.params;
    const { title, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        message: "title and description are required",
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

    const newIssue = await prisma.issue.create({
      data: {
        sectionId: sectionId,
        title: title,
        description: description,
      },
    });

    return res.status(201).json({
      message: "Issue Created Succsfully",
      newIssue,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

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

issueRouter.patch("/:sectionId/:issueId", async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionId, issueId } = req.params;
    const { title, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!title && !description) {
      return res.status(400).json({
        message: "Atleast one Field is required",
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

    const existIssue = await prisma.issue.findFirst({
        where:{
            id: issueId,
            sectionId: sectionId
        }
    })

    if(!existIssue){
        return res.status(404).json({
        message: "Issue Not Found",
      });
    }

    type data ={
        title?: string,
        description?: string
    }
    const data: data = {}

    if(title){
        data.title = title
    }

    if(description){
        data.description = description
    }

    const updatedIssue = await prisma.issue.update({
        where: {
            id: issueId
        },
        data: data
    })

    return res.status(200).json({
      message: "issue updated successfully",
      updatedIssue
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

export default issueRouter;
