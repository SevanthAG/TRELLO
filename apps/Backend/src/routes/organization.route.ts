import { Router } from "express";
import { prisma } from "db/client";

const orgRoute = Router();

orgRoute.post("/", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { orgName, description } = req.body;

    if (!orgName || !description) {
      return res.status(400).json({
        message: "Missing orgName or Description",
      });
    }

    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: orgName,
      },
    });

    if (existingOrg) {
      return res.status(409).json({
        message: "Organization Already exist",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          description,
        },
      });

      const membership = await tx.membership.create({
        data: {
          role: "ADMIN",
          organizationId: organization.id,
          userId,
        },
      });

      return { organization, membership };
    });
    return res.status(201).json({
      message: "Organization Created Successfully..",
      organization: result.organization.id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

orgRoute.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: userId,
      },
      include: {
        organization: true,
      },
    });

    return res.status(200).json({
      message: "Organizations fetched successfully",
      organizations: memberships.map((m) => {
        return {
          id: m.organization.id,
          name: m.organization.name,
          description: m.organization.description,
        };
      }),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});

orgRoute.patch("/:orgId", async (req, res) => {
  try {
    const userId = req.userId;
    const { orgId } = req.params;

    const { orgName, description } = req.body;

    if(!orgName && !description){
        return res.status(400).json({
            message: "Atleast one field is required."
        })
    }

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!orgId) {
      return res.status(400).json({
        message: "OrgId is required",
      });
    }

    const existOrganization = await prisma.organization.findFirst({
      where: {
        id: orgId,
      },
    });

    if (!existOrganization) {
      return res.status(404).json({
        message: "Organization not exist",
      });
    }

    const existingMember = await prisma.membership.findFirst({
        where: {
            userId: userId,
            organizationId: orgId
        }
    })

    if(!existingMember){
        return res.status(403).json({
            message: "You are not allowed"
        })
    }

    if(existingMember.role !== "ADMIN"){
        return res.status(403).json({
            message: "You are not allowed"
        })
    }

    type data = {
        name?: string,
        description? : string
    }

    const data: data = {}

    if(orgName){
        data.name = orgName
    }

    if(description){
        data.description = description
    }

    const updatedOrganization = await prisma.organization.update({
        where: {
            id: orgId
        },
        data: data
    })

    return res.status(200).json({
        message: "Organization updated",
        updatedOrganization
    })
} catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server Error",
    });
  }
});



export default orgRoute;
