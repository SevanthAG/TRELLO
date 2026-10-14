import { prisma } from "db/client";

type OperationResult<T> = { ok: true; value: T } | { ok: false; error: string };

type IssuePayload = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
};

type MoveIssueInput = {
  userId: string;
  boardId: string;
  issueId: string;
  sourceSectionId: string;
  destinationSectionId: string;
};

type DeleteIssueInput = {
  userId: string;
  boardId: string;
  issueId: string;
};

type DeleteSectionInput = {
  userId: string;
  boardId: string;
  sectionId: string;
};

const hasPrismaCode = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

export const moveIssue = async ({
  userId,
  boardId,
  issueId,
  sourceSectionId,
  destinationSectionId,
}: MoveIssueInput): Promise<OperationResult<{ issue: IssuePayload }>> =>
  prisma.$transaction(async (tx) => {
    if (sourceSectionId === destinationSectionId) {
      return { ok: false, error: "Issue is already in that section" };
    }

    const issue = await tx.issue.findUnique({
      where: { id: issueId },
      include: { section: { include: { board: true } } },
    });
    if (!issue) return { ok: false, error: "Issue not found" };
    if (issue.section.boardId !== boardId) {
      return { ok: false, error: "Issue does not belong to this board" };
    }

    const membership = await tx.membership.findFirst({
      where: {
        userId,
        organizationId: issue.section.board.organizationId,
      },
    });
    if (!membership) {
      return { ok: false, error: "You are not a member of this organization" };
    }
    if (issue.sectionId !== sourceSectionId) {
      return { ok: false, error: "Issue has already moved; refresh the board" };
    }

    const destination = await tx.section.findUnique({
      where: { id: destinationSectionId },
      select: { id: true, boardId: true },
    });
    if (!destination || destination.boardId !== issue.section.boardId) {
      return { ok: false, error: "Destination section is not on this board" };
    }

    const update = await tx.issue.updateMany({
      where: { id: issueId, sectionId: sourceSectionId },
      data: { sectionId: destinationSectionId },
    });
    if (update.count !== 1) {
      return { ok: false, error: "Issue has already moved; refresh the board" };
    }

    const movedIssue = await tx.issue.findUnique({
      where: { id: issueId },
      select: { id: true, title: true, description: true, sectionId: true },
    });
    if (!movedIssue) {
      return { ok: false, error: "Issue no longer exists" };
    }
    return { ok: true, value: { issue: movedIssue } };
  });

export const deleteIssue = async ({
  userId,
  boardId,
  issueId,
}: DeleteIssueInput): Promise<OperationResult<{ issueId: string }>> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: issueId },
        include: { section: { include: { board: true } } },
      });
      if (!issue) return { ok: false, error: "Issue not found" };
      if (issue.section.boardId !== boardId) {
        return { ok: false, error: "Issue does not belong to this board" };
      }

      const membership = await tx.membership.findFirst({
        where: {
          userId,
          organizationId: issue.section.board.organizationId,
        },
      });
      if (!membership) {
        return {
          ok: false,
          error: "You are not a member of this organization",
        };
      }

      await tx.issue.delete({ where: { id: issueId } });
      return { ok: true, value: { issueId } };
    });
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      return { ok: false, error: "Issue not found" };
    }
    throw error;
  }
};

export const deleteSection = async ({
  userId,
  boardId,
  sectionId,
}: DeleteSectionInput): Promise<
  OperationResult<{ boardId: string; sectionId: string }>
> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { id: true, organizationId: true },
      });
      if (!board) return { ok: false, error: "Board not found" };

      const membership = await tx.membership.findFirst({
        where: { userId, organizationId: board.organizationId },
      });
      if (!membership) {
        return {
          ok: false,
          error: "You are not a member of this organization",
        };
      }
      if (membership.role !== "ADMIN") {
        return { ok: false, error: "Only ADMIN can delete sections" };
      }

      const section = await tx.section.findFirst({
        where: { id: sectionId, boardId },
        select: { id: true },
      });
      if (!section) {
        return { ok: false, error: "Section not found on this board" };
      }

      const issueCount = await tx.issue.count({ where: { sectionId } });
      if (issueCount > 0) {
        return {
          ok: false,
          error: "Move or delete the section's issues before deleting it",
        };
      }

      await tx.section.delete({ where: { id: sectionId } });
      return { ok: true, value: { boardId, sectionId } };
    });
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      return { ok: false, error: "Section not found on this board" };
    }
    if (hasPrismaCode(error, "P2003")) {
      return {
        ok: false,
        error: "Move or delete the section's issues before deleting it",
      };
    }
    throw error;
  }
};
