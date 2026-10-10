import { Router } from "express";
import { prisma } from "db/client";

const memberRoute = Router();

memberRoute.post("/:orgId", async (req, res) => {
  try {
    const userId = req.userId;
    const { orgId } = req.params

    const { email, role } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (role !== "ADMIN" && role !== "MEMBER") {
      return res.status(400).json({
        message: "Invalid role",
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
        message: "You are not a member of this organization",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "You are not authorized to add members to this organization",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: orgId,
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        message: "User is already a member of this organization",
      });
    }

    const newMembership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role: role,
      },
    });

    return res.status(201).json({
        message: "Membership Created Successfully,",
        newMembership
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});


memberRoute.get('/:orgId', async (req, res) => {
  const userId = req.userId;
  const { orgId } = req.params

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const checkMembership = await prisma.membership.findFirst({
    where: {
      organizationId: orgId,
      userId: userId,
    },
  });

  if (!checkMembership) {
    return res.status(403).json({
      message: "You are not the member of the Organization",
    });
  }

  const membership = await prisma.membership.findMany({
    where: {
      organizationId: orgId,
    },
    include: {
      user: true,
    },
  });

  res.status(200).json({
    message: "members fetched Successfully..",
    membership: membership.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      role: member.role,
    })),
  });
});

export default memberRoute;