import { prisma } from "db/client";
import { Router } from "express";

const boardRoute = Router();

boardRoute.post('/:orgId/board', async (req, res)=>{
    try {
        const { title } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }
        const orgId = Number(req.params.orgId);

        if (!Number.isInteger(orgId)) {
            return res.status(400).json({
                message: "Invalid organization ID"
            })
        }
        
        const organization = await prisma.organization.findUnique({
            where: {
                id: orgId
            }
        })

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            })
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: userId,
                organizationId: orgId
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Forbidden"
            })
        }

        if (membership.role !== "ADMIN") {
            return res.status(403).json({
                message: "You do not have permission to create a board in this organization"
            })
        }

        const existingBoard = await prisma.board.findFirst({
            where: {
                organizationId: orgId,
                title: title
            }
        })

        if (existingBoard) {
            return res.status(409).json({
                message: "A board with this title already exists in this organization"
            })
        }

        const newBoard = await prisma.board.create({
            data: {
                organizationId: orgId,
                title: title
            }
        })

        return res.status(201).json({
            message: "Board created successfully",
            board: newBoard
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

boardRoute.get('/:orgId/boards', async (req, res)=>{
    try {
        const userId = req.userId;
        const orgId = Number(req.params.orgId);

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        if (!Number.isInteger(orgId)) {
            return res.status(400).json({
                message: "Invalid organization ID"
            })
        }

        const organization = await prisma.organization.findUnique({
            where: {
                id: orgId
            }
        })

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            })
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: userId,
                organizationId: orgId
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Forbidden"
            })
        }

        const boards = await prisma.board.findMany({
            where: {
                organizationId: orgId
            }
        })

        return res.status(200).json({
            message: "Boards retrieved successfully",
            boards: boards
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})

boardRoute.get('/', async (req, res)=>{
    try {
        const userId = req.userId;
        const boardId = Number(req.query.boardId);
        const orgId = Number(req.query.orgId);

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        if (!Number.isInteger(boardId)) {
            return res.status(400).json({
                message: "Invalid board ID"
            })
        }

        if (!Number.isInteger(orgId)) {
            return res.status(400).json({
                message: "Invalid organization ID"
            })
        }
        
        const organization = await prisma.organization.findUnique({
            where: {
                id: orgId
            }
        })

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            })
        }
        const membership = await prisma.membership.findFirst({
            where: {
                userId: userId,
                organizationId: orgId
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Forbidden"
            })
        }

        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                organizationId: orgId
            }
        })

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            })
        }

        return res.status(200).json({
            message: "Board retrieved successfully",
            board: board
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server Error"
        })
    }
})



export default boardRoute;