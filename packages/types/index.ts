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

export type ServerEvent =
  | { type: "section_added"; payload: Section }
  | { type: "section_updated"; payload: Section }
  | { type: "section_deleted"; payload: Section }
  | { type: "Issue_Added"; payload: Issue }
  | { type: "issue_updated"; payload: Issue }
  | { type: "issue_deleted"; payload: Issue }
  | { type: "issue_moved"; payload: Issue };

export type ClientEvent =
  | { type: "join_room"; boardId: string }
  | { type: "add_section"; boardId: string; payload: { title: string } }
  | {
      type: "update_section";
      boardId: string;
      payload: { sectionId: string; title: string };
    }
  | {
      type: "delete_section";
      boardId: string;
      payload: { sectionId: string };
    }
  | {
      type: "add_issue";
      boardId: string;
      payload: { sectionId: string; title: string; description: string };
    }
  | {
      type: "update_issue";
      boardId: string;
      payload: {
        sectionId: string;
        issueId: string;
        title: string;
        description: string;
      };
    }
  | {
      type: "delete_issue";
      boardId: string;
      payload: { sectionId: string; issueId: string };
    }
  | {
      type: "move_issue";
      boardId: string;
      payload: {
        issueId: string;
        sectionId: string;
        newSectionId: string;
      };
    };

export type WsEvent = ServerEvent | ClientEvent;
