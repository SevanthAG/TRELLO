import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

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

type AckError = { message?: string } | null;

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const socketRef = useRef<Socket | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  // create section
  const [sectionTitle, setSectionTitle] = useState("");
  const [createSectionOpen, setCreateSectionOpen] = useState(false);

  // edit section
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  // create issue (shared across sections, only one dialog open at a time)
  const [addingIssueTo, setAddingIssueTo] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  // edit issue
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");

  useEffect(() => {
    if (!boardId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    if (socketRef.current) return;

    const socket = io("http://localhost:8080", { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("board:join", { boardId });

      socket.timeout(3000).emit(
        "section:list",
        { boardId },
        (err: AckError, res?: { sections?: Section[]; error?: string }) => {
          if (err) {
            toast.add({ title: err.message ?? "Failed to load sections", type: "error" });
            return;
          }
          if (res?.error) {
            toast.add({ title: res.error, type: "error" });
            return;
          }
          setSections(res?.sections ?? []);
        },
      );

      socket.timeout(3000).emit(
        "issue:list",
        { boardId },
        (err: AckError, res?: { issues?: Issue[]; error?: string }) => {
          if (err) {
            toast.add({ title: err.message ?? "Failed to load issues", type: "error" });
            return;
          }
          if (res?.error) {
            toast.add({ title: res.error, type: "error" });
            return;
          }
          setIssues(res?.issues ?? []);
        },
      );
    });

    socket.on("connect_error", (err) => {
      toast.add({ title: err.message, type: "error" });
    });

    // real-time: every change in the board room lands here (creator included)
    socket.on("section:created", (payload?: { section?: Section }) => {
      const section = payload?.section;
      if (!section) return;
      setSections((prev) =>
        prev.some((s) => s.id === section.id) ? prev : [...prev, section],
      );
    });

    socket.on("section:updated", (payload?: { section?: Section }) => {
      const section = payload?.section;
      if (!section) return;
      setSections((prev) => prev.map((s) => (s.id === section.id ? section : s)));
    });

    socket.on("issue:created", (payload?: { issue?: Issue }) => {
      const issue = payload?.issue;
      if (!issue) return;
      setIssues((prev) => (prev.some((i) => i.id === issue.id) ? prev : [...prev, issue]));
    });

    socket.on("issue:updated", (payload?: { issue?: Issue }) => {
      const issue = payload?.issue;
      if (!issue) return;
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  const handleCreateSection = (e: FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return;

    if (!sectionTitle.trim()) {
      toast.add({ title: "Title Required", type: "error" });
      return;
    }

    socket.timeout(3000).emit(
      "section:create",
      { boardId, title: sectionTitle.trim() },
      (err: AckError, res?: { error?: string }) => {
        if (err) {
          toast.add({ title: err.message ?? "Failed to create section", type: "error" });
          return;
        }
        if (res?.error) {
          toast.add({
            title: res.error === "You are not allowed" ? "Only ADMIN can create sections" : res.error,
            type: "error",
          });
          return;
        }
        toast.add({ title: "New Section Created", type: "success" });
        setSectionTitle("");
        setCreateSectionOpen(false);
      },
    );
  };

  const openEditSection = (s: Section) => {
    setEditingSectionId(s.id);
    setEditSectionTitle(s.title);
    setSectionDialogOpen(true);
  };

  const handleUpdateSection = (e: FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket || !editingSectionId) return;

    if (!editSectionTitle.trim()) {
      toast.add({ title: "Title Required", type: "error" });
      return;
    }

    socket.timeout(3000).emit(
      "section:update",
      { boardId, sectionId: editingSectionId, title: editSectionTitle.trim() },
      (err: AckError, res?: { error?: string }) => {
        if (err) {
          toast.add({ title: err.message ?? "Failed to update section", type: "error" });
          return;
        }
        if (res?.error) {
          toast.add({
            title: res.error === "You are not allowed to modify" ? "Only ADMIN can update sections" : res.error,
            type: "error",
          });
          return;
        }
        toast.add({ title: "Section Updated", type: "success" });
        setSectionDialogOpen(false);
      },
    );
  };

  const handleCreateIssue = (e: FormEvent, sectionId: string) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket) return;

    if (!issueTitle.trim() || !issueDescription.trim()) {
      toast.add({ title: "Title and description Needed", type: "error" });
      return;
    }

    socket.timeout(3000).emit(
      "issue:create",
      { sectionId, title: issueTitle.trim(), description: issueDescription.trim() },
      (err: AckError, res?: { error?: string }) => {
        if (err) {
          toast.add({ title: err.message ?? "Failed to create issue", type: "error" });
          return;
        }
        if (res?.error) {
          toast.add({ title: res.error, type: "error" });
          return;
        }
        toast.add({ title: "Issue Added", type: "success" });
        setIssueTitle("");
        setIssueDescription("");
        setAddingIssueTo(null);
      },
    );
  };

  const openEditIssue = (i: Issue) => {
    setEditingIssue(i);
    setEditIssueTitle(i.title);
    setEditIssueDescription(i.description);
    setIssueDialogOpen(true);
  };

  const handleUpdateIssue = (e: FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket || !editingIssue) return;

    const title = editIssueTitle.trim();
    const description = editIssueDescription.trim();

    if (!title && !description) {
      toast.add({ title: "At least one field is required", type: "error" });
      return;
    }

    socket.timeout(3000).emit(
      "issue:update",
      { issueId: editingIssue.id, title, description },
      (err: AckError, res?: { error?: string }) => {
        if (err) {
          toast.add({ title: err.message ?? "Failed to update issue", type: "error" });
          return;
        }
        if (res?.error) {
          toast.add({ title: res.error, type: "error" });
          return;
        }
        toast.add({ title: "Issue Updated", type: "success" });
        setIssueDialogOpen(false);
      },
    );
  };

  return (
    <div>
      <div className="flex gap-1.5 justify-center m-5">
        <Dialog open={createSectionOpen} onOpenChange={setCreateSectionOpen}>
          <DialogTrigger
            render={
              <Button variant="outline">
                <Plus /> Create Section
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <form className="m-5" onSubmit={handleCreateSection}>
              <Input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Section title"
              />
              <DialogFooter>
                <Button type="submit">Create Section</Button>
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <form className="m-5" onSubmit={handleUpdateSection}>
              <Input
                type="text"
                value={editSectionTitle}
                onChange={(e) => setEditSectionTitle(e.target.value)}
                placeholder="Section title"
              />
              <DialogFooter>
                <Button type="submit">Save</Button>
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <form className="m-5" onSubmit={handleUpdateIssue}>
              <Input
                value={editIssueTitle}
                onChange={(e) => setEditIssueTitle(e.target.value)}
                placeholder="Issue title"
              />
              <Input
                value={editIssueDescription}
                onChange={(e) => setEditIssueDescription(e.target.value)}
                placeholder="Issue description"
              />
              <DialogFooter>
                <Button type="submit">Save</Button>
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        {sections.length === 0 ? (
          <p className="text-center m-5">No sections yet</p>
        ) : (
          <div className="flex justify-evenly">
            {sections.map((item) => (
              <div key={item.id}>
                <div className="flex gap-5">
                  <h2>{item.title}</h2>
                  <Button variant="outline" onClick={() => openEditSection(item)}>
                    Edit
                  </Button>
                  <div>
                    <Dialog
                      open={addingIssueTo === item.id}
                      onOpenChange={(open) => {
                        if (!open) setAddingIssueTo(null);
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button variant="outline" onClick={() => setAddingIssueTo(item.id)}>
                            <Plus />
                            Add Issue
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-sm">
                        <form onSubmit={(e) => handleCreateIssue(e, item.id)}>
                          <Input
                            value={issueTitle}
                            onChange={(e) => setIssueTitle(e.target.value)}
                            placeholder="Issue title"
                          />
                          <Input
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            placeholder="Issue description"
                          />
                          <DialogFooter>
                            <Button type="submit">Create Issue</Button>
                            <DialogClose
                              render={
                                <Button variant="outline" type="button">
                                  Cancel
                                </Button>
                              }
                            />
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div>
                  {issues
                    .filter((c) => c.sectionId === item.id)
                    .map((c) => (
                      <div key={c.id} className="border">
                        <h3>Title: {c.title}</h3>
                        <p>Description: {c.description}</p>
                        <Button variant="outline" onClick={() => openEditIssue(c)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
