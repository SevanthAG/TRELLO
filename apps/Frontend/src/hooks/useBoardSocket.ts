import { useBoardStore } from "@/Store/BoardStrore";
import { useSocketStore } from "@/Store/socketStore";
import { useEffect, useState } from "react";
import type { WsEvent } from "types/client";

type BoardSection = {
  id: string;
  title: string;
  boardId: string;
};

export const useBoardSocket = (boardId: string | undefined) => {
  const {  addIssue, deleteIssue, updateIssue, moveIssue } = useBoardStore();

  const { socket, wsSend } = useSocketStore();
  const [section, setSection] = useState<BoardSection[]>([]);

  useEffect(() => {
    if (!socket || !boardId) return;

    socket.onopen = () => {
      wsSend({
        type: "join_room",
        boardId,
      });
    };

    socket.onmessage = (event) => {
      const parsedData = JSON.parse(event.data) as WsEvent;

      if (parsedData.type == "section_added") {
        setSection((prev) => [...prev, parsedData.payload]);
      }

      if (parsedData.type === "section_updated") {
        setSection((prev) =>
          prev.map((item) =>
            item.id === parsedData.payload.id
              ? { ...item, title: parsedData.payload.title }
              : item,
          ),
        );
      }

      if (parsedData.type == "section_deleted") {
        setSection((prev) =>
          prev.filter((item) => item.id !== parsedData.payload.id),
        );
      }

      if (parsedData.type == "Issue_Added") {
        addIssue(parsedData.payload);
      }

      if (parsedData.type === "issue_updated") {
        updateIssue(parsedData.payload);
      }

      if (parsedData.type == "issue_moved") {
        moveIssue(parsedData.payload.id, parsedData.payload.sectionId);
      }

      if (parsedData.type == "issue_deleted") {
        deleteIssue(parsedData.payload.id);
      }
    };

    return () => {
      socket.close();
    };
  }, [socket]);

  return { section, setSection };
};
