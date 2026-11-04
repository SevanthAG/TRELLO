import { useDrop } from "react-dnd";
import type { ReactNode } from "react";

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
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ISSUE",
    drop: (item: DragItem) => {
        console.log("Issue ID:", item.id);
    console.log("Target Section ID:", section.id);
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
