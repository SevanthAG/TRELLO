import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router";
import { io, type Socket } from "socket.io-client";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ArrowLeft,
  Circle,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Radio,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type Section = {
  id: string;
  title: string;
  boardId: string;
};

type Issue = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
};

const isSection = (value: unknown): value is Section =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "title" in value &&
  typeof value.title === "string" &&
  "boardId" in value &&
  typeof value.boardId === "string";

const isIssue = (value: unknown): value is Issue =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "title" in value &&
  typeof value.title === "string" &&
  "description" in value &&
  typeof value.description === "string" &&
  "sectionId" in value &&
  typeof value.sectionId === "string";

type AckError = { message?: string } | null;
type SocketReply<T> = { error?: string } & T;
type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";
type DraggedIssue = {
  boardId: string;
  issueId: string;
  sourceSectionId: string;
};
type BoardEvent = { event: string; payload: unknown };

const issueDragType = "board-issue";

type IssueCardProps = {
  boardId: string;
  issue: Issue;
  sections: Section[];
  disabled: boolean;
  deleting: boolean;
  moving: boolean;
  onMove: (item: DraggedIssue, destinationSectionId: string) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
};

const IssueCard = ({
  boardId,
  issue,
  sections,
  disabled,
  deleting,
  moving,
  onMove,
  onEdit,
  onDelete,
}: IssueCardProps) => {
  const [{ isDragging }, drag, preview] = useDrag<
    DraggedIssue,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: issueDragType,
      item: {
        boardId,
        issueId: issue.id,
        sourceSectionId: issue.sectionId,
      },
      canDrag: !disabled && !deleting && !moving,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [boardId, deleting, disabled, issue.id, issue.sectionId, moving],
  );

  const connectPreview = useCallback(
    (node: HTMLElement | null) => {
      preview(node);
    },
    [preview],
  );
  const connectHandle = useCallback(
    (node: HTMLSpanElement | null) => {
      drag(node);
    },
    [drag],
  );

  return (
    <article
      className={`issue-card${isDragging ? " issue-card-dragging" : ""}${moving ? " issue-card-moving" : ""}`}
      ref={connectPreview}
      aria-busy={deleting || moving}
    >
      <div className="issue-card-heading">
        <h3>{issue.title}</h3>
        <div className="issue-card-actions">
          <span
            className="issue-drag-handle"
            ref={connectHandle}
            aria-hidden="true"
            title="Drag to move"
          >
            <GripVertical aria-hidden="true" />
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Edit ${issue.title}`}
            disabled={disabled || deleting || moving}
            onClick={() => onEdit(issue)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${issue.title}`}
            disabled={disabled || deleting || moving}
            onClick={() => onDelete(issue)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      {issue.description && <p>{issue.description}</p>}
      <label className="issue-move-label">
        <span className="sr-only">Move {issue.title} to section</span>
        <select
          className="issue-move-select"
          aria-label={`Move ${issue.title} to section`}
          disabled={disabled || deleting || moving}
          value=""
          onChange={(event) => {
            const destinationSectionId = event.target.value;
            if (destinationSectionId) {
              onMove(
                {
                  boardId,
                  issueId: issue.id,
                  sourceSectionId: issue.sectionId,
                },
                destinationSectionId,
              );
            }
          }}
        >
          <option value="">Move to…</option>
          {sections
            .filter((section) => section.id !== issue.sectionId)
            .map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
        </select>
      </label>
      {(deleting || moving) && (
        <span className="issue-pending-label">
          {deleting ? "Deleting…" : "Moving…"}
        </span>
      )}
    </article>
  );
};

type SectionLaneProps = {
  boardId: string;
  section: Section;
  sections: Section[];
  issues: Issue[];
  index: number;
  disabled: boolean;
  deleting: boolean;
  deletingIssueIds: Set<string>;
  movingIssueIds: Set<string>;
  onMove: (item: DraggedIssue, destinationSectionId: string) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onAddIssue: (sectionId: string) => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issue: Issue) => void;
};

const SectionLane = ({
  boardId,
  section,
  sections,
  issues,
  index,
  disabled,
  deleting,
  deletingIssueIds,
  movingIssueIds,
  onMove,
  onEditSection,
  onDeleteSection,
  onAddIssue,
  onEditIssue,
  onDeleteIssue,
}: SectionLaneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop<
    DraggedIssue,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: issueDragType,
      canDrop: (item) =>
        !disabled &&
        !deleting &&
        item.boardId === boardId &&
        item.sourceSectionId !== section.id,
      drop: (item) => onMove(item, section.id),
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [boardId, deleting, disabled, onMove, section.id],
  );
  const connectDropTarget = useCallback(
    (node: HTMLElement | null) => {
      drop(node);
    },
    [drop],
  );

  return (
    <section
      className={`section-lane${canDrop ? " section-lane-drop-valid" : ""}${isOver && canDrop ? " section-lane-drop-active" : ""}${deleting ? " section-lane-pending" : ""}`}
      ref={connectDropTarget}
      aria-label={`${section.title}, ${issues.length} issues`}
    >
      <div className={`lane-accent lane-accent-${index % 4}`} />
      <header className="lane-header">
        <div className="lane-title-wrap">
          <span className="lane-count">{issues.length}</span>
          <h2 className="lane-title">{section.title}</h2>
        </div>
        <div className="lane-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${section.title}`}
            disabled={disabled || deleting}
            onClick={() => onEditSection(section)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add issue to ${section.title}`}
            disabled={disabled || deleting}
            onClick={() => onAddIssue(section.id)}
          >
            <Plus aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${section.title}`}
            disabled={disabled || deleting}
            onClick={() => onDeleteSection(section)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </header>
      {isOver && canDrop && (
        <p className="drop-target-hint" role="status">
          Move here
        </p>
      )}
      <div className="issue-list">
        {issues.length === 0 ? (
          <p className="lane-empty">Nothing here yet</p>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              boardId={boardId}
              issue={issue}
              sections={sections}
              disabled={disabled || deleting}
              deleting={deletingIssueIds.has(issue.id)}
              moving={movingIssueIds.has(issue.id)}
              onMove={onMove}
              onEdit={onEditIssue}
              onDelete={onDeleteIssue}
            />
          ))
        )}
      </div>
      <Button
        variant="ghost"
        className="lane-add-issue"
        disabled={disabled || deleting}
        onClick={() => onAddIssue(section.id)}
      >
        <Plus aria-hidden="true" />
        Add an issue
      </Button>
    </section>
  );
};

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const sectionsRef = useRef(sections);
  const [issues, setIssues] = useState<Issue[]>([]);
  const issuesRef = useRef(issues);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardError, setBoardError] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [addingIssueTo, setAddingIssueTo] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [movingIssueIds, setMovingIssueIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletingIssueIds, setDeletingIssueIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletingSectionIds, setDeletingSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingMovesRef = useRef(
    new Map<
      string,
      {
        sourceSectionId: string;
        destinationSectionId: string;
        receivedBroadcast: boolean;
      }
    >(),
  );
  const pendingIssueDeletesRef = useRef(new Set<string>());
  const pendingSectionDeletesRef = useRef(new Set<string>());
  const deletedIssueIdsRef = useRef(new Set<string>());
  const deletedSectionIdsRef = useRef(new Set<string>());
  const snapshotReadyRef = useRef(false);
  const queuedEventsRef = useRef<BoardEvent[]>([]);

  const updateSections = useCallback(
    (update: (current: Section[]) => Section[]) => {
      const next = update(sectionsRef.current);
      sectionsRef.current = next;
      setSections(next);
    },
    [],
  );

  const updateIssues = useCallback((update: (current: Issue[]) => Issue[]) => {
    const next = update(issuesRef.current);
    issuesRef.current = next;
    setIssues(next);
  }, []);

  const applyBoardEvent = useCallback(
    (event: string, payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;
      const data = payload as Record<string, unknown>;

      if (event === "section:created" || event === "section:updated") {
        const section = data.section;
        if (
          !isSection(section) ||
          section.boardId !== boardId ||
          deletedSectionIdsRef.current.has(section.id)
        ) {
          return;
        }
        updateSections((current) =>
          event === "section:created"
            ? current.some((item) => item.id === section.id)
              ? current
              : [...current, section]
            : current.map((item) => (item.id === section.id ? section : item)),
        );
        return;
      }

      if (event === "section:deleted") {
        const deletedSectionId = data.sectionId;
        if (
          data.boardId !== boardId ||
          typeof deletedSectionId !== "string" ||
          !deletedSectionId
        ) {
          return;
        }
        deletedSectionIdsRef.current.add(deletedSectionId);
        updateSections((current) =>
          current.filter((section) => section.id !== deletedSectionId),
        );
        updateIssues((current) =>
          current.filter((issue) => issue.sectionId !== deletedSectionId),
        );
        pendingSectionDeletesRef.current.delete(deletedSectionId);
        setDeletingSectionIds((current) => {
          const next = new Set(current);
          next.delete(deletedSectionId);
          return next;
        });
        return;
      }

      if (event === "issue:created" || event === "issue:updated") {
        const issue = data.issue;
        if (
          !isIssue(issue) ||
          deletedIssueIdsRef.current.has(issue.id) ||
          deletedSectionIdsRef.current.has(issue.sectionId)
        ) {
          return;
        }
        updateIssues((current) => {
          if (event === "issue:created") {
            if (
              !sectionsRef.current.some(
                (section) => section.id === issue.sectionId,
              )
            ) {
              return current;
            }
            return current.some((item) => item.id === issue.id)
              ? current
              : [...current, issue];
          }
          return current.map((item) =>
            item.id === issue.id
              ? { ...item, ...issue, sectionId: item.sectionId }
              : item,
          );
        });
        return;
      }

      if (event === "issue:moved") {
        const issue = data.issue;
        const sourceSectionId = data.sourceSectionId;
        const destinationSectionId = data.destinationSectionId;
        if (
          data.boardId !== boardId ||
          !isIssue(issue) ||
          typeof sourceSectionId !== "string" ||
          typeof destinationSectionId !== "string" ||
          issue.sectionId !== destinationSectionId ||
          deletedIssueIdsRef.current.has(issue.id) ||
          deletedSectionIdsRef.current.has(destinationSectionId) ||
          !sectionsRef.current.some(
            (section) => section.id === destinationSectionId,
          )
        ) {
          return;
        }
        const pendingMove = pendingMovesRef.current.get(issue.id);
        if (
          pendingMove &&
          pendingMove.sourceSectionId === sourceSectionId &&
          pendingMove.destinationSectionId === destinationSectionId
        ) {
          pendingMove.receivedBroadcast = true;
        }
        updateIssues((current) => {
          const existing = current.find((item) => item.id === issue.id);
          if (
            existing &&
            existing.sectionId !== sourceSectionId &&
            existing.sectionId !== destinationSectionId &&
            !deletedSectionIdsRef.current.has(existing.sectionId)
          ) {
            return current;
          }
          return existing
            ? current.map((item) =>
                item.id === issue.id ? { ...item, ...issue } : item,
              )
            : [...current, issue];
        });
        return;
      }

      if (event === "issue:deleted") {
        const deletedIssueId = data.issueId;
        if (
          data.boardId !== boardId ||
          typeof deletedIssueId !== "string" ||
          !deletedIssueId
        ) {
          return;
        }
        deletedIssueIdsRef.current.add(deletedIssueId);
        updateIssues((current) =>
          current.filter((issue) => issue.id !== deletedIssueId),
        );
        pendingIssueDeletesRef.current.delete(deletedIssueId);
        setDeletingIssueIds((current) => {
          const next = new Set(current);
          next.delete(deletedIssueId);
          return next;
        });
      }
    },
    [boardId, updateIssues, updateSections],
  );

  const receiveBoardEvent = useCallback(
    (event: string, payload: unknown) => {
      if (!snapshotReadyRef.current) {
        queuedEventsRef.current.push({ event, payload });
        return;
      }
      applyBoardEvent(event, payload);
    },
    [applyBoardEvent],
  );

  useEffect(() => {
    if (!boardId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    let active = true;
    pendingMovesRef.current.clear();
    pendingIssueDeletesRef.current.clear();
    pendingSectionDeletesRef.current.clear();
    deletedIssueIdsRef.current.clear();
    deletedSectionIdsRef.current.clear();
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8080",
      {
        auth: { token },
        reconnection: true,
      },
    );
    socketRef.current = socket;

    const request = <T,>(
      event: string,
      payload: object,
    ): Promise<SocketReply<T>> =>
      new Promise((resolve, reject) => {
        socket
          .timeout(5000)
          .emit(
            event,
            payload,
            (error: AckError, response?: SocketReply<T>) => {
              if (error) {
                reject(
                  new Error(error.message || `Request timed out: ${event}`),
                );
              } else if (!response || response.error) {
                reject(
                  new Error(response?.error || `Empty response: ${event}`),
                );
              } else {
                resolve(response);
              }
            },
          );
      });

    const loadBoardData = async () => {
      snapshotReadyRef.current = false;
      queuedEventsRef.current = [];
      try {
        const joined = await request<{ joined?: boolean }>("board:join", {
          boardId,
        });
        if (!joined.joined) throw new Error("Could not join board");

        const [sectionsResponse, issuesResponse] = await Promise.all([
          request<{ sections?: Section[] }>("section:list", { boardId }),
          request<{ issues?: Issue[] }>("issue:list", { boardId }),
        ]);
        if (
          !Array.isArray(sectionsResponse.sections) ||
          !sectionsResponse.sections.every(isSection) ||
          !Array.isArray(issuesResponse.issues) ||
          !issuesResponse.issues.every(isIssue)
        ) {
          throw new Error("Board returned invalid data");
        }
        if (!active) return;

        const liveSections = sectionsResponse.sections.filter(
          (section) => !deletedSectionIdsRef.current.has(section.id),
        );
        const liveSectionIds = new Set(
          liveSections.map((section) => section.id),
        );
        const liveIssues = issuesResponse.issues.filter(
          (issue) =>
            !deletedIssueIdsRef.current.has(issue.id) &&
            liveSectionIds.has(issue.sectionId),
        );
        updateSections(() => liveSections);
        updateIssues(() => liveIssues);
        setBoardError(false);
        snapshotReadyRef.current = true;
        const queuedEvents = queuedEventsRef.current.splice(0);
        queuedEvents.forEach(({ event, payload }) =>
          applyBoardEvent(event, payload),
        );
      } catch (error) {
        if (!active) return;
        setBoardError(true);
        toast.add({
          title:
            error instanceof Error
              ? error.message
              : "Could not load board data",
          type: "error",
        });
      } finally {
        if (active) setLoadingBoard(false);
      }
    };

    socket.on("connect", () => {
      if (!active) return;
      setConnection("connected");
      setLoadingBoard(true);
      void loadBoardData();
    });
    socket.on("disconnect", () => {
      if (active) setConnection("offline");
    });
    socket.io.on("reconnect_attempt", () => {
      if (active) setConnection("reconnecting");
    });
    socket.on("connect_error", (error) => {
      if (!active) return;
      setConnection("offline");
      setBoardError(true);
      setLoadingBoard(false);
      if (
        error.message === "Invalid token" ||
        error.message === "Token Missing"
      ) {
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
        return;
      }
      toast.add({
        title: error.message || "Could not connect to the board",
        type: "error",
      });
    });
    const boardEvents = [
      "section:created",
      "section:updated",
      "section:deleted",
      "issue:created",
      "issue:updated",
      "issue:moved",
      "issue:deleted",
    ];
    const eventHandlers = new Map<string, (payload?: unknown) => void>();
    boardEvents.forEach((event) => {
      const handler = (payload?: unknown) => receiveBoardEvent(event, payload);
      eventHandlers.set(event, handler);
      socket.on(event, handler);
    });
    const onReconnectAttempt = () => {
      if (active) setConnection("reconnecting");
    };
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      active = false;
      snapshotReadyRef.current = false;
      eventHandlers.forEach((handler, event) => socket.off(event, handler));
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [
    applyBoardEvent,
    boardId,
    navigate,
    receiveBoardEvent,
    updateIssues,
    updateSections,
  ]);

  const emitMutation = <T,>(
    event: string,
    payload: object,
    onSuccess: (response: T) => void,
    failureTitle: string,
  ) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      toast.add({
        title: "Reconnect to the board before saving",
        type: "error",
      });
      return;
    }
    setSaving(true);
    socket
      .timeout(5000)
      .emit(event, payload, (error: AckError, response?: SocketReply<T>) => {
        setSaving(false);
        if (error || response?.error) {
          toast.add({
            title: response?.error ?? error?.message ?? failureTitle,
            type: "error",
          });
          return;
        }
        if (!response) {
          toast.add({ title: failureTitle, type: "error" });
          return;
        }
        onSuccess(response);
      });
  };

  const moveIssueToSection = useCallback(
    (draggedIssue: DraggedIssue, destinationSectionId: string) => {
      const socket = socketRef.current;
      const issue = issuesRef.current.find(
        (item) => item.id === draggedIssue.issueId,
      );
      const sourceSection = sectionsRef.current.find(
        (section) => section.id === draggedIssue.sourceSectionId,
      );
      const destinationSection = sectionsRef.current.find(
        (section) => section.id === destinationSectionId,
      );
      if (
        !socket?.connected ||
        !boardId ||
        draggedIssue.boardId !== boardId ||
        !issue ||
        issue.sectionId !== draggedIssue.sourceSectionId ||
        !sourceSection ||
        !destinationSection ||
        destinationSection.id === sourceSection.id ||
        deletedSectionIdsRef.current.has(destinationSection.id) ||
        pendingMovesRef.current.has(issue.id) ||
        pendingIssueDeletesRef.current.has(issue.id) ||
        deletedIssueIdsRef.current.has(issue.id)
      ) {
        return;
      }

      const pendingMove = {
        sourceSectionId: sourceSection.id,
        destinationSectionId: destinationSection.id,
        receivedBroadcast: false,
      };
      pendingMovesRef.current.set(issue.id, pendingMove);
      setMovingIssueIds((current) => new Set(current).add(issue.id));
      updateIssues((current) =>
        current.map((item) =>
          item.id === issue.id
            ? { ...item, sectionId: destinationSection.id }
            : item,
        ),
      );

      socket.timeout(5000).emit(
        "issue:move",
        {
          boardId,
          issueId: issue.id,
          sourceSectionId: sourceSection.id,
          destinationSectionId: destinationSection.id,
        },
        (error: AckError, response?: SocketReply<{ issue?: Issue }>) => {
          if (socketRef.current !== socket) return;
          pendingMovesRef.current.delete(issue.id);
          setMovingIssueIds((current) => {
            const next = new Set(current);
            next.delete(issue.id);
            return next;
          });

          const movedIssue = response?.issue;
          if (error || response?.error || !isIssue(movedIssue)) {
            if (deletedIssueIdsRef.current.has(issue.id)) {
              toast.add({
                title: "Issue was deleted by another user",
                type: "info",
              });
              return;
            }
            if (!pendingMove.receivedBroadcast) {
              updateIssues((current) =>
                current.map((item) =>
                  item.id === issue.id &&
                  item.sectionId === destinationSection.id
                    ? { ...item, sectionId: sourceSection.id }
                    : item,
                ),
              );
            }
            if (pendingMove.receivedBroadcast) {
              toast.add({ title: "Issue moved", type: "success" });
            } else {
              toast.add({
                title:
                  response?.error ??
                  error?.message ??
                  "Move was rejected by the server",
                type: "error",
              });
            }
            return;
          }

          if (deletedIssueIdsRef.current.has(movedIssue.id)) {
            toast.add({
              title: "Issue was deleted by another user",
              type: "info",
            });
            return;
          }
          if (
            movedIssue.id !== issue.id ||
            movedIssue.sectionId !== destinationSection.id
          ) {
            toast.add({
              title: "Server returned an invalid move result",
              type: "error",
            });
            return;
          }
          applyBoardEvent("issue:moved", {
            boardId,
            sourceSectionId: sourceSection.id,
            destinationSectionId: destinationSection.id,
            issue: movedIssue,
          });
          toast.add({ title: "Issue moved", type: "success" });
        },
      );
    },
    [applyBoardEvent, boardId, updateIssues],
  );

  const handleDeleteIssue = (issue: Issue) => {
    const socket = socketRef.current;
    if (!boardId || !socket?.connected) {
      toast.add({
        title: "Reconnect to the board before deleting",
        type: "error",
      });
      return;
    }
    if (
      pendingIssueDeletesRef.current.has(issue.id) ||
      pendingMovesRef.current.has(issue.id)
    ) {
      return;
    }
    if (!window.confirm(`Delete "${issue.title}"? This cannot be undone.`)) {
      return;
    }

    pendingIssueDeletesRef.current.add(issue.id);
    setDeletingIssueIds((current) => new Set(current).add(issue.id));
    socket
      .timeout(5000)
      .emit(
        "issue:delete",
        { boardId, issueId: issue.id },
        (error: AckError, response?: SocketReply<{ issueId?: string }>) => {
          if (socketRef.current !== socket) return;
          pendingIssueDeletesRef.current.delete(issue.id);
          setDeletingIssueIds((current) => {
            const next = new Set(current);
            next.delete(issue.id);
            return next;
          });
          if (deletedIssueIdsRef.current.has(issue.id)) {
            toast.add({ title: "Issue deleted", type: "success" });
            return;
          }
          if (error || response?.error || response?.issueId !== issue.id) {
            toast.add({
              title:
                response?.error ?? error?.message ?? "Could not delete issue",
              type: "error",
            });
            return;
          }
          applyBoardEvent("issue:deleted", { boardId, issueId: issue.id });
          toast.add({ title: "Issue deleted", type: "success" });
        },
      );
  };

  const handleDeleteSection = (section: Section) => {
    const socket = socketRef.current;
    if (!boardId || !socket?.connected) {
      toast.add({
        title: "Reconnect to the board before deleting",
        type: "error",
      });
      return;
    }
    if (pendingSectionDeletesRef.current.has(section.id)) return;
    if (
      !window.confirm(
        `Delete "${section.title}"? The section must be empty; its issues will not be deleted.`,
      )
    ) {
      return;
    }

    pendingSectionDeletesRef.current.add(section.id);
    setDeletingSectionIds((current) => new Set(current).add(section.id));
    socket
      .timeout(5000)
      .emit(
        "section:delete",
        { boardId, sectionId: section.id },
        (
          error: AckError,
          response?: SocketReply<{ boardId?: string; sectionId?: string }>,
        ) => {
          if (socketRef.current !== socket) return;
          pendingSectionDeletesRef.current.delete(section.id);
          setDeletingSectionIds((current) => {
            const next = new Set(current);
            next.delete(section.id);
            return next;
          });
          if (deletedSectionIdsRef.current.has(section.id)) {
            toast.add({ title: "Section deleted", type: "success" });
            return;
          }
          if (
            error ||
            response?.error ||
            response?.boardId !== boardId ||
            response?.sectionId !== section.id
          ) {
            toast.add({
              title:
                response?.error ?? error?.message ?? "Could not delete section",
              type: "error",
            });
            return;
          }
          applyBoardEvent("section:deleted", {
            boardId,
            sectionId: section.id,
          });
          toast.add({ title: "Section deleted", type: "success" });
        },
      );
  };

  const handleCreateSection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = sectionTitle.trim();
    if (!title || !boardId || saving) {
      if (!title) toast.add({ title: "Enter a section name", type: "error" });
      return;
    }
    emitMutation<{ section?: Section }>(
      "section:create",
      { boardId, title },
      (response) => {
        const newSection = response.section;
        if (!isSection(newSection)) {
          toast.add({
            title: "Board returned an invalid section",
            type: "error",
          });
          return;
        }
        updateSections((current) =>
          current.some((section) => section.id === newSection.id)
            ? current
            : [...current, newSection],
        );
        setSectionTitle("");
        setSectionDialogOpen(false);
        toast.add({ title: "Section created", type: "success" });
      },
      "Could not create section",
    );
  };

  const handleUpdateSection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = editSectionTitle.trim();
    if (!title || !boardId || !editingSection || saving) {
      if (!title) toast.add({ title: "Enter a section name", type: "error" });
      return;
    }
    emitMutation<{ section?: Section }>(
      "section:update",
      { boardId, sectionId: editingSection.id, title },
      (response) => {
        const updatedSection = response.section;
        if (!isSection(updatedSection)) {
          toast.add({
            title: "Board returned an invalid section",
            type: "error",
          });
          return;
        }
        updateSections((current) =>
          current.map((section) =>
            section.id === updatedSection.id ? updatedSection : section,
          ),
        );
        setEditingSection(null);
        toast.add({ title: "Section updated", type: "success" });
      },
      "Could not update section",
    );
  };

  const handleCreateIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = issueTitle.trim();
    const description = issueDescription.trim();
    if (saving) return;
    if (!title || !description || !addingIssueTo) {
      toast.add({
        title: "Enter an issue title and description",
        type: "error",
      });
      return;
    }
    emitMutation<{ issue?: Issue }>(
      "issue:create",
      { sectionId: addingIssueTo, title, description },
      (response) => {
        const newIssue = response.issue;
        if (!isIssue(newIssue)) {
          toast.add({
            title: "Board returned an invalid issue",
            type: "error",
          });
          return;
        }
        updateIssues((current) =>
          current.some((issue) => issue.id === newIssue.id)
            ? current
            : [...current, newIssue],
        );
        setIssueTitle("");
        setIssueDescription("");
        setAddingIssueTo(null);
        toast.add({ title: "Issue created", type: "success" });
      },
      "Could not create issue",
    );
  };

  const handleUpdateIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = editIssueTitle.trim();
    const description = editIssueDescription.trim();
    if (saving) return;
    if ((!title && !description) || !editingIssue) {
      toast.add({ title: "Enter a title or description", type: "error" });
      return;
    }
    emitMutation<{ issue?: Issue }>(
      "issue:update",
      { issueId: editingIssue.id, title, description },
      (response) => {
        const updatedIssue = response.issue;
        if (!isIssue(updatedIssue)) {
          toast.add({
            title: "Board returned an invalid issue",
            type: "error",
          });
          return;
        }
        updateIssues((current) =>
          current.map((issue) =>
            issue.id === updatedIssue.id ? updatedIssue : issue,
          ),
        );
        setEditingIssue(null);
        toast.add({ title: "Issue updated", type: "success" });
      },
      "Could not update issue",
    );
  };

  const connectionLabel: Record<ConnectionState, string> = {
    connecting: "Connecting",
    connected: "Live",
    reconnecting: "Reconnecting",
    offline: "Offline",
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="page-stack board-page">
        <header className="page-heading board-page-heading">
          <div>
            <Link className="back-link" to="/dashboard">
              <ArrowLeft aria-hidden="true" />
              All boards
            </Link>
            <p className="eyebrow">Board workspace</p>
            <h1 className="pixel-heading">Project board</h1>
            <p className="page-intro">
              Organize work into sections and keep the details close.
            </p>
          </div>
          <div
            className={`connection-pill connection-${connection}`}
            role="status"
            aria-live="polite"
          >
            {connection === "connecting" || connection === "reconnecting" ? (
              <LoaderCircle className="connection-spinner" aria-hidden="true" />
            ) : connection === "connected" ? (
              <Radio aria-hidden="true" />
            ) : (
              <Circle aria-hidden="true" />
            )}
            {connectionLabel[connection]}
          </div>
        </header>

        <div className="board-toolbar">
          <p className="board-help">
            {connection === "connected"
              ? "Changes from your team appear here in real time."
              : "Your board will reconnect automatically. Saving is paused while offline."}
          </p>
          <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  className="action-button"
                  disabled={connection !== "connected" || boardError}
                >
                  <Plus aria-hidden="true" />
                  Add section
                </Button>
              }
            />
            <DialogContent className="app-dialog">
              <DialogHeader>
                <p className="eyebrow">Board layout</p>
                <DialogTitle className="pixel-heading dialog-heading">
                  Create a section
                </DialogTitle>
              </DialogHeader>
              <form className="form-stack" onSubmit={handleCreateSection}>
                <div className="field-stack">
                  <Label htmlFor="section-title">Section name</Label>
                  <Input
                    id="section-title"
                    autoFocus
                    required
                    value={sectionTitle}
                    onChange={(event) => setSectionTitle(event.target.value)}
                    placeholder="e.g. In progress"
                  />
                </div>
                <DialogFooter className="dialog-actions">
                  <DialogClose
                    render={
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    }
                  />
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Create section"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingBoard ? (
          <div className="state-panel" role="status">
            Loading board…
          </div>
        ) : boardError ? (
          <div className="state-panel" role="alert">
            <p>
              Board data could not be loaded. Check your connection and retry.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : sections.length === 0 ? (
          <section className="empty-panel board-empty">
            <span className="empty-icon" aria-hidden="true">
              <Plus />
            </span>
            <h2 className="section-heading">Shape your board</h2>
            <p>Add a section to give your team's work a place to land.</p>
            <Button
              onClick={() => setSectionDialogOpen(true)}
              disabled={connection !== "connected" || boardError}
            >
              <Plus aria-hidden="true" />
              Add first section
            </Button>
          </section>
        ) : (
          <div className="section-lanes">
            {sections.map((section, index) => (
              <SectionLane
                key={section.id}
                boardId={boardId ?? ""}
                section={section}
                sections={sections}
                issues={issues.filter(
                  (issue) => issue.sectionId === section.id,
                )}
                index={index}
                disabled={connection !== "connected" || boardError}
                deleting={deletingSectionIds.has(section.id)}
                deletingIssueIds={deletingIssueIds}
                movingIssueIds={movingIssueIds}
                onMove={moveIssueToSection}
                onEditSection={(selectedSection) => {
                  setEditingSection(selectedSection);
                  setEditSectionTitle(selectedSection.title);
                }}
                onDeleteSection={handleDeleteSection}
                onAddIssue={setAddingIssueTo}
                onEditIssue={(selectedIssue) => {
                  setEditingIssue(selectedIssue);
                  setEditIssueTitle(selectedIssue.title);
                  setEditIssueDescription(selectedIssue.description);
                }}
                onDeleteIssue={handleDeleteIssue}
              />
            ))}
          </div>
        )}

        <Dialog
          open={!!editingSection}
          onOpenChange={(open) => !open && setEditingSection(null)}
        >
          <DialogContent className="app-dialog">
            <DialogHeader>
              <p className="eyebrow">Board layout</p>
              <DialogTitle className="pixel-heading dialog-heading">
                Rename section
              </DialogTitle>
            </DialogHeader>
            <form className="form-stack" onSubmit={handleUpdateSection}>
              <div className="field-stack">
                <Label htmlFor="edit-section-title">Section name</Label>
                <Input
                  id="edit-section-title"
                  autoFocus
                  required
                  value={editSectionTitle}
                  onChange={(event) => setEditSectionTitle(event.target.value)}
                />
              </div>
              <DialogFooter className="dialog-actions">
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!addingIssueTo}
          onOpenChange={(open) => !open && setAddingIssueTo(null)}
        >
          <DialogContent className="app-dialog">
            <DialogHeader>
              <p className="eyebrow">Add to this section</p>
              <DialogTitle className="pixel-heading dialog-heading">
                Create an issue
              </DialogTitle>
            </DialogHeader>
            <form className="form-stack" onSubmit={handleCreateIssue}>
              <div className="field-stack">
                <Label htmlFor="issue-title">Issue title</Label>
                <Input
                  id="issue-title"
                  autoFocus
                  required
                  value={issueTitle}
                  onChange={(event) => setIssueTitle(event.target.value)}
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="field-stack">
                <Label htmlFor="issue-description">Description</Label>
                <textarea
                  className="app-textarea"
                  id="issue-description"
                  required
                  rows={4}
                  value={issueDescription}
                  onChange={(event) => setIssueDescription(event.target.value)}
                  placeholder="Add useful context for your team"
                />
              </div>
              <DialogFooter className="dialog-actions">
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Create issue"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingIssue}
          onOpenChange={(open) => !open && setEditingIssue(null)}
        >
          <DialogContent className="app-dialog">
            <DialogHeader>
              <p className="eyebrow">Issue details</p>
              <DialogTitle className="pixel-heading dialog-heading">
                Edit issue
              </DialogTitle>
            </DialogHeader>
            <form className="form-stack" onSubmit={handleUpdateIssue}>
              <div className="field-stack">
                <Label htmlFor="edit-issue-title">Issue title</Label>
                <Input
                  id="edit-issue-title"
                  autoFocus
                  value={editIssueTitle}
                  onChange={(event) => setEditIssueTitle(event.target.value)}
                />
              </div>
              <div className="field-stack">
                <Label htmlFor="edit-issue-description">Description</Label>
                <textarea
                  className="app-textarea"
                  id="edit-issue-description"
                  rows={4}
                  value={editIssueDescription}
                  onChange={(event) =>
                    setEditIssueDescription(event.target.value)
                  }
                />
                <span className="field-hint">
                  Leave a field blank to keep its current value.
                </span>
              </div>
              <DialogFooter className="dialog-actions">
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </DndProvider>
  );
};

export default Board;
