import type { ReactNode } from "react";
import { useDrag } from "react-dnd";

type Issue = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
};

type IssueCardProps = {
  issue: Issue;
  children?: ReactNode;
};

const IssueCard = ({ issue, children }: IssueCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ISSUE",
    item: {
      id: issue.id,
      sectionId: issue.sectionId,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={(node) => {
        drag(node);
      }}
      className={`border rounded-lg p-3 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <h3>{issue.title}</h3>
      <p>{issue.description}</p>

      {children}
    </div>
  );
};

export default IssueCard;
