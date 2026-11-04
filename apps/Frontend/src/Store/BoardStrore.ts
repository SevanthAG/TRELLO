import type { Issue } from "@/lib/types";
import { create } from "zustand";

type Store = {
  issue: Issue[];
  putIssue: (issue: Issue[]) => void;
  updateIssue: (issue: Issue) => void;
  deleteIssue: (issueId: string) => void;
  addIssue: (issue: Issue) => void;
};

export const useBoardStore = create<Store>()((set, get) => ({
  issue: [],
  addIssue: (issue) => set((state) => ({ issue: [...state.issue, issue] })),
  putIssue: (issue) => set({ issue }),
  updateIssue: (updatedIssue) => {
    const { issue } = get();
    const updatedIssues = issue.map((item) =>
      item.id === updatedIssue.id
        ? {
            ...item,
            title: updatedIssue.title,
            description: updatedIssue.description,
          }
        : item,
    );
    set({ issue: updatedIssues });
  },
  deleteIssue: (issueId) =>
    set((state) => ({
      issue: state.issue.filter((issue) => issue.id !== issueId),
    })),
}));
