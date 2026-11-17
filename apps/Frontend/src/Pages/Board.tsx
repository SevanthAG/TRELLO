import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import IssueCard from "@/components/Board/IssueCard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Section from "@/components/Board/Section";
import { useBoardStore } from "@/Store/BoardStrore";
import { useSocketStore } from "@/Store/socketStore";
import { useBoardSocket } from "@/hooks/useBoardSocket";

const Board = () => {
  const { issue, putIssue } = useBoardStore();
  const { setSocket, wsSend } = useSocketStore();

  const { boardId } = useParams();

  const [title, setTitle] = useState("");
  const [updatedTitle, setUpdatedTitle] = useState("");

  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  // const [issue, setIssue] = useState<Issue[]>([]);

  const [updatedIssueTitle, setUpdatedIssueTitle] = useState("");
  const [updatedIssueDescription, setUpdatedIssueDescription] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!setSocket()) {
      navigate("/signin");
    }
  }, []);

  const { section, setSection } = useBoardSocket(boardId);

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
        putIssue(response.data.issues);
      } catch (err) {
        toast.add({ title: "Failed to load issues", type: "error" });
      }
    };

    getIssues();
  }, [boardId]);

  const handleCreateSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!boardId) return;
    wsSend({
      type: "add_section",
      boardId,
      payload: {
        title: title,
      },
    });
  };

  const handleUpdateSection = async (
    e: React.FormEvent<HTMLFormElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    if (!boardId) return;
    wsSend({
      type: "update_section",
      boardId,
      payload: {
        title: updatedTitle,
        sectionId,
      },
    });
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!boardId) return;
    wsSend({
      type: "delete_section",
      boardId,
      payload: {
        sectionId,
      },
    });
  };

  const handleAddIssue = async (
    e: React.FormEvent<HTMLFormElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    if (!boardId) return;
    wsSend({
      type: "add_issue",
      boardId,
      payload: {
        sectionId,
        title: issueTitle,
        description: issueDescription,
      },
    });
  };

  const handleUpdateIssue = (
    e: React.FormEvent<HTMLFormElement>,
    issueId: string,
    sectionId: string,
  ) => {
    e.preventDefault();
    if (!boardId) return;

    wsSend({
      type: "update_issue",
      boardId,
      payload: {
        sectionId,
        issueId,
        title: updatedIssueTitle,
        description: updatedIssueDescription,
      },
    });
  };

  const handleDeleteIssue = async (sectionId: string, issueId: string) => {
    if (!boardId) return;
    wsSend({
      type: "delete_issue",
      boardId,
      payload: {
        sectionId,
        issueId,
      },
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
          {section.length === 0 ? (
            <p>No sections yet</p>
          ) : (
            <div className="flex justify-evenly">
              {section.map((item) => (
                <Section key={item.id} section={item}>
                  <div>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant="outline"
                            onClick={() => setUpdatedTitle(item.title)}
                          >
                            Update Section
                          </Button>
                        }
                      />

                      <DialogContent className="sm:max-w-sm">
                        <form
                          className="m-5"
                          onSubmit={(e) => handleUpdateSection(e, item.id)}
                        >
                          <Input
                            type="text"
                            value={updatedTitle}
                            onChange={(e) => setUpdatedTitle(e.target.value)}
                            placeholder="Section title"
                          />

                          <DialogFooter>
                            <Button type="submit">Update Section</Button>
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

                  <Button onClick={() => handleDeleteSection(item.id)}>
                    Delete Section
                  </Button>

                  <div>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button variant="outline">
                            {" "}
                            <Plus /> Add Issue
                          </Button>
                        }
                      />

                      <DialogContent className="sm:max-w-sm">
                        <form
                          className="m-5"
                          onSubmit={(e) => handleAddIssue(e, item.id)}
                        >
                          <Input
                            type="text"
                            value={issueTitle}
                            onChange={(e) => setIssueTitle(e.target.value)}
                            placeholder="Issue title"
                          />
                          <Input
                            type="text"
                            value={issueDescription}
                            onChange={(e) =>
                              setIssueDescription(e.target.value)
                            }
                            placeholder="Issue Description"
                          />

                          <DialogFooter>
                            <Button type="submit">Add Issue</Button>
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
                    {issue
                      .filter((c) => c.sectionId === item.id)
                      .map((c) => (
                        <IssueCard key={c.id} issue={c}>
                          <div>
                            <Dialog>
                              <DialogTrigger
                                render={
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setUpdatedIssueTitle(c.title);
                                      setUpdatedIssueDescription(c.description);
                                    }}
                                  >
                                    Update Issue
                                  </Button>
                                }
                              />

                              <DialogContent className="sm:max-w-sm">
                                <form
                                  className="m-5"
                                  onSubmit={(e) =>
                                    handleUpdateIssue(e, c.id, item.id)
                                  }
                                >
                                  <Input
                                    value={updatedIssueTitle}
                                    onChange={(e) =>
                                      setUpdatedIssueTitle(e.target.value)
                                    }
                                    placeholder="Issue title"
                                  />

                                  <Input
                                    value={updatedIssueDescription}
                                    onChange={(e) =>
                                      setUpdatedIssueDescription(e.target.value)
                                    }
                                    placeholder="Issue description"
                                  />

                                  <DialogFooter>
                                    <Button type="submit">Update Issue</Button>

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
                          <Button
                            onClick={() => handleDeleteIssue(item.id, c.id)}
                          >
                            Delete Issue
                          </Button>
                        </IssueCard>
                      ))}
                  </div>
                </Section>
              ))}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Board;
