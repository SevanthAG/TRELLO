export type Issue = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
};

export type Section = {
  id: string;
  title: string;
  boardId: string;
};

export type WsEvent =
  | { type: "section_added"; payload: Section }
  | { type: "section_updated"; payload: Section }
  | { type: "section_deleted"; payload: Section }
  | { type: "Issue_Added"; payload: Issue }
  | { type: "issue_updated"; payload: Issue }
  | { type: "issue_deleted"; payload: Issue };
