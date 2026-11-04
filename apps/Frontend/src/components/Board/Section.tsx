import { useDrop } from "react-dnd";
import type { ReactNode } from "react";
import { useBoardStore } from "@/Store/BoardStrore";
import { useSocketStore } from "@/Store/socketStore";

type BoardSection = {
  id: string;
  title: string;
  boardId: string;
};

type DragItem = {
  id: string;
  sectionId: string;
};

type SectionProps = {
  section: BoardSection;
  children?: ReactNode;
};

const Section = ({ section, children }: SectionProps) => {
  const { moveIssue } = useBoardStore();
  const { wsSend } = useSocketStore();
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ISSUE",
    drop: (item: DragItem) => {
      wsSend({
        type: "move_issue",
        boardId: section.boardId,
        payload: {
          issueId: item.id,
          sectionId: item.sectionId,
          newSectionId: section.id,
        },
      });
      moveIssue(item.id, section.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      className={`border rounded-lg p-3 ${isOver ? "bg-gray-100" : ""}`}
    >
      <h2>{section.title}</h2>

      {children}
    </div>
  );
};

export default Section;
