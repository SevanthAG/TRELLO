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

const Board = () => {
  const { boardId } = useParams();

  const [sectionTitle, setSectionTitle] = useState("");
  const [section, setSection] = useState<Section[]>([]);

  const [issue, setIssue] = useState<Issue[]>([]);
  const [issueTittle, setIssueTittle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const navigate = useNavigate();

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

      setSection((prev) => [...prev, response.data.newSection]);
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

      setIssue((prev) => [...prev, response.data.newIssue]);

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
      </div>

      <div>
        {section.length === 0 ? (
          <p>No sections yet</p>
        ) : (
          <div className="flex justify-evenly">
            {section.map((item) => (
              <div>
                <div key={item.id} className="flex gap-5">
                  <h2>{item.title}</h2>
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
