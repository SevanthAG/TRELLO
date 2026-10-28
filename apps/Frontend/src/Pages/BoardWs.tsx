import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
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

const BoardWs = () => {
  const { boardId } = useParams();

  const [sectionTitle, setSectionTitle] = useState("");
  const [section, setSection] = useState<Section[]>([]);

  const [issue, setIssue] = useState<Issue[]>([]);
  const [issueTittle, setIssueTittle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");

  const navigate = useNavigate();

  const openEditSection = (s: Section) => {
    setEditingSectionId(s.id);
    setEditSectionTitle(s.title);
    setSectionDialogOpen(true);
  };

  const openEditIssue = (i: Issue) => {
    setEditingIssue(i);
    setEditIssueTitle(i.title);
    setEditIssueDescription(i.description);
    setIssueDialogOpen(true);
  };

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   const socket = new WebSocket(
  //     `ws://localhost:3000?boardId=${boardId}&token=${token}`,
  //   );

  //   socket.onopen = () => {
  //     console.log("WebSocket connected!");
  //   };

  //   socket.onmessage = (event) => {
  //     const parsedData = JSON.parse(event.data);

  //     if (parsedData.boardId !== boardId) {
  //       return;
  //     }

  //     if (parsedData.type === "section:created") {
  //       setSection((prev) =>
  //         prev.some((s) => s.id === parsedData.payload.id)
  //           ? prev
  //           : [...prev, parsedData.payload],
  //       );
  //     }

  //     if (parsedData.type === "section:updated") {
  //       setSection((prev) =>
  //         prev.map((s) =>
  //           s.id === parsedData.payload.id
  //             ? { ...s, title: parsedData.payload.title }
  //             : s,
  //         ),
  //       );
  //     }

  //     if (parsedData.type === "issue:created") {
  //       setIssue((prev) =>
  //         prev.some((i) => i.id === parsedData.payload.id)
  //           ? prev
  //           : [...prev, parsedData.payload],
  //       );
  //     }

  //     if (parsedData.type === "issue:updated") {
  //       setIssue((prev) =>
  //         prev.map((i) =>
  //           i.id === parsedData.payload.id
  //             ? { ...i, ...parsedData.payload }
  //             : i,
  //         ),
  //       );
  //     }
  //   };

  //   socket.onerror = (error) => {
  //     console.error("WebSocket error:", error);
  //   };

  //   socket.onclose = () => {
  //     console.log("WebSocket disconnected");
  //   };

  //   return () => {
  //     socket.close();
  //   };
  // }, [boardId]);

  const handleCreateSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const data = {
        title: sectionTitle,
      };

      if (!sectionTitle.trim()) {
        toast.add({
          title: "Title Required",
          type: "error",
        });
        return;
      }

      const response = await api.post(`/section/${boardId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSection((prev) =>
        prev.some((s) => s.id === response.data.newSection.id)
          ? prev
          : [...prev, response.data.newSection],
      );
      toast.add({
        title: "New Section Created",
        type: "success",
      });
      setSectionTitle("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403)
          toast.add({ title: "Only ADMIN can create sections", type: "error" });
        else if (err.response?.status === 404)
          toast.add({ title: "Board not found", type: "error" });
        else toast.add({ title: "Failed to create section", type: "error" });
      } else toast.add({ title: "Failed to create section", type: "error" });
    }
  };

  useEffect(() => {
    const getSection = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        const response = await api.get(`/section/${boardId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSection(response.data.sections);
      } catch (err) {
        toast.add({
          title: "Failed to load sections",
          type: "error",
        });
      }
    };
    getSection();
  }, [boardId]);

  const handleCreateIssue = async (
    e: React.FormEvent<HTMLFormElement>,
    sectionId: string,
  ) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const data = {
        title: issueTittle,
        description: issueDescription,
      };

      if (!issueTittle.trim() || !issueDescription.trim()) {
        toast.add({
          title: "Title and description Needed",
          type: "error",
        });
        return;
      }

      const response = await api.post(`/issue/${sectionId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIssue((prev) =>
      prev.some((i) => i.id === response.data.newIssue.id)
        ? prev
        : [...prev, response.data.newIssue]
    );

      toast.add({
        title: "Issue Added",
        type: "success",
      });
      setIssueTittle("");
      setIssueDescription("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400)
          toast.add({ title: "Title and description required", type: "error" });
        else if (err.response?.status === 404)
          toast.add({ title: "Section not found", type: "error" });
        else if (err.response?.status === 403)
          toast.add({ title: "Not a member of this board", type: "error" });
        else if (err.response?.status === 401)
          toast.add({ title: "Session expired — signin again", type: "error" });
        else toast.add({ title: "Failed to create issue", type: "error" });
      } else toast.add({ title: "Failed to create issue", type: "error" });
    }
  };

  const handleUpdateSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      if (!editingSectionId) return;

      if (!editSectionTitle.trim()) {
        toast.add({
          title: "Title Required",
          type: "error",
        });
        return;
      }

      const response = await api.patch(
        `/section/${boardId}/${editingSectionId}`,
        { title: editSectionTitle.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedTitle = response.data.updatedSection.title;

      setSection((prev) =>
        prev.map((s) =>
          s.id === editingSectionId ? { ...s, title: updatedTitle } : s,
        ),
      );

      toast.add({
        title: "Section Updated",
        type: "success",
      });
      setSectionDialogOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403)
          toast.add({
            title: "Only ADMIN can update sections",
            type: "error",
          });
        else if (err.response?.status === 404)
          toast.add({ title: "Section not found", type: "error" });
        else toast.add({ title: "Failed to update section", type: "error" });
      } else toast.add({ title: "Failed to update section", type: "error" });
    }
  };

  const handleUpdateIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      if (!editingIssue) return;

      const data: { title?: string; description?: string } = {};

      if (editIssueTitle.trim()) data.title = editIssueTitle.trim();
      if (editIssueDescription.trim())
        data.description = editIssueDescription.trim();

      if (!data.title && !data.description) {
        toast.add({
          title: "At least one field is required",
          type: "error",
        });
        return;
      }

      await api.patch(
        `/issue/${editingIssue.sectionId}/${editingIssue.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIssue((prev) =>
        prev.map((i) => (i.id === editingIssue.id ? { ...i, ...data } : i)),
      );

      toast.add({
        title: "Issue Updated",
        type: "success",
      });
      setIssueDialogOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403)
          toast.add({ title: "Not a member of this board", type: "error" });
        else if (err.response?.status === 404)
          toast.add({ title: "Issue not found", type: "error" });
        else toast.add({ title: "Failed to update issue", type: "error" });
      } else toast.add({ title: "Failed to update issue", type: "error" });
    }
  };

  useEffect(() => {
    const getIssues = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        const response = await api.get(`/issue/board/${boardId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIssue(response.data.issues);
      } catch (err) {
        toast.add({ title: "Failed to load issues", type: "error" });
      }
    };

    getIssues();
  }, [boardId]);

  return (
    <div>
      <div className="flex gap-1.5 justify-center m-5">
        <div>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline">
                  {" "}
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
        </div>

        <div>
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
        </div>

        <div>
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
      </div>

      <div>
        {section.length === 0 ? (
          <p>No sections yet</p>
        ) : (
          <div className="flex justify-evenly">
            {section.map((item) => (
              <div key={item.id}>
                <div className="flex gap-5">
                  <h2>{item.title}</h2>
                  <Button
                    variant="outline"
                    onClick={() => openEditSection(item)}
                  >
                    Edit
                  </Button>
                  <div>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button variant="outline">
                            <Plus />
                            Add Issue
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-sm">
                        <form onSubmit={(e) => handleCreateIssue(e, item.id)}>
                          <Input
                            value={issueTittle}
                            onChange={(e) => setIssueTittle(e.target.value)}
                            placeholder="Issue title"
                          />
                          <Input
                            value={issueDescription}
                            onChange={(e) =>
                              setIssueDescription(e.target.value)
                            }
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
                  {issue
                    .filter((c) => c.sectionId === item.id)
                    .map((c) => (
                      <div key={c.id} className="border ">
                        <h3>Title: {c.title}</h3>
                        <p>Description: {c.description}</p>
                        <Button
                          variant="outline"
                          onClick={() => openEditIssue(c)}
                        >
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

export default BoardWs;
