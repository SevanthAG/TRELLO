import { Router } from "express";
import { prisma } from "db/client";
import { authmiddleware } from "../middleware/authmidleware";

const orgRoute = Router();

orgRoute.post('/create', authmiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const { orgName, description } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const existingOrg = await prisma.organization.findFirst({
            where: {
                name: orgName
            }
        })

        if (existingOrg) {
            return res.status(409).json({
                message: "Organization ALready exist"
            })
        }

        const result = await prisma.$transaction(async (tx) => {

            const organization = await tx.organization.create({
                data: {
                    name: orgName,
                    description
                }
            });

            const membership = await tx.membership.create({
                data: {
                    userId,
                    organizationId: organization.id,
                    role: "ADMIN"
                }
            });

            return { organization, membership };
        });

        return res.status(201).json({
            message: "Organization Created Successfully..",
            organization: result.organization,
            membership: result.membership
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

orgRoute.get('/get-organizations', authmiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const memberships = await prisma.membership.findMany({
            where: {
                userId: userId
            },
            include: {
                organization: true
            }
        })

        return res.status(200).json({
            message: "Organizations fetched successfully",
            organizations: memberships.map(m => {
                return {
                    id: m.organization.id,
                    name: m.organization.name,
                    description: m.organization.description,
                    role: m.role
                }
            })
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

orgRoute.get('/get-organization/:orgId', authmiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const orgId = Number(req.params.orgId);

        if (!Number.isInteger(orgId)) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (!orgId) {
            return res.status(400).json({
                message: "Organization ID is required"
            })
        }

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: userId,
                organizationId: orgId
            },
            include: {
                organization: true
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization"
            })
        }

        return res.status(200).json({
            message: "Organization fetched successfully",
            organization: {
                id: membership.organization.id,
                name: membership.organization.name,
                description: membership.organization.description,
                role: membership.role
            }
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

orgRoute.post("/:orgId/add-member", authmiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const orgId = Number(req.params.orgId);
        const { email, role } = req.body;

        if (!Number.isInteger(orgId)) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        if (role !== "ADMIN" && role !== "MEMBER") {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: userId,
                organizationId: orgId
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization"
            })
        }

        if (membership.role !== "ADMIN") {
            return res.status(403).json({
                message: "You are not authorized to add members to this organization"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const existingMembership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                organizationId: orgId
            }
        })

        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this organization"
            })
        }

        const newMembership = await prisma.membership.create({
            data: {
                userId: user.id,
                organizationId: orgId,
                role: role
            }
        })

        return res.status(201).json({
                id: newMembership.userId,
                username: user.username,
                email: user.email,
                role: newMembership.role
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

orgRoute.get("/:orgId/getMembers", authmiddleware, async (req, res) => {
    const userId = req.userId;
    const orgId = Number(req.params.orgId);

    if (!Number.isInteger(orgId)) {
        return res.status(400).json({
            message: "Invalid organization ID"
        });
    }

    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const checkMembership = await prisma.membership.findFirst({
        where: {
            organizationId: orgId,
            userId: userId
        }
    })

    if(!checkMembership){
        return res.status(403).json({
            message: "You are not the member of the Organization"
        })
    }

    const membership = await prisma.membership.findMany({
        where: {
            organizationId: orgId
        },
        include: {
            user: true
        }
    })

    res.status(200).json({
        message: "members fetched Successfully..",
        membership: membership.map((member)=>({
            id: member.user.id,
            username: member.user.username,
            email: member.user.email,
            role: member.role,
        })
    )
    })
})

export default orgRoute;
