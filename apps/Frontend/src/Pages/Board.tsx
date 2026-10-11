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

      try {
        const response = await axios.get(
          `http://localhost:3000/api/board/${boardId}/sections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = response.data;

        setSection(data.sections);
      } catch (err) {
        console.log(err);
      }
    };

    getSection();
  }, [boardId]);

  useEffect(() => {
    const getIssues = async () => {
      const token = localStorage.getItem("token");

      try {
        const allIssues: Issue[] = [];

        for (const currentSection of section) {
          const response = await axios.get(
            `http://localhost:3000/api/board/${boardId}/sections/${currentSection.id}/issues`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = response.data;

          console.log("ISSUE RESPONSE:", data);

          allIssues.push(...data.Issue);
        }

        setIssue(allIssues);
      } catch (err) {
        console.log(err);
      }
    };

    if (section.length > 0) {
      getIssues();
    }
  }, [section, boardId]);

  const handleCreateIssue = async (
    e: React.FormEvent<HTMLFormElement>,
    sectionId: number,
  ) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const data = {
        title: issueTittle,
        description: issueDescription,
      };

      const response = await axios.post(
        `http://localhost:3000/api/board/${boardId}/sections/${sectionId}/issue`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIssue((prev) => [...prev, response.data.issue]);

      setIssueTittle("");
      setIssueDescription("");
    } catch (err) {
      console.log("Error While creating Issue", err);
    }
  };

  return (
    <div>
      <div className="flex gap-1.5 justify-center m-5">
        <div>
          <Dialog>
            <DialogTrigger
              render={<Button variant="outline">Create Section</Button>}
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

      <div className="flex gap-4 mt-6 overflow-x-auto">
        {section.map((item) => (
          <div
            key={item.id}
            className="w-72 min-w-72 rounded-lg border bg-muted p-4"
          >
            <h2 className="font-semibold text-lg">{item.title}</h2>

            <div className="mt-4 space-y-2">
              {issue
                .filter((currentIssue) => currentIssue.sectionId === item.id)
                .map((currentIssue) => (
                  <div
                    key={currentIssue.id}
                    className="rounded-md border bg-background p-3"
                  >
                    <h3 className="font-medium">{currentIssue.title}</h3>

                    <p className="text-sm text-muted-foreground">
                      {currentIssue.description}
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-4">
              <Dialog>
                <DialogTrigger
                  render={<Button variant="outline">Create Issue</Button>}
                />

                <DialogContent className="sm:max-w-sm">
                  <form onSubmit={(e) => handleCreateIssue(e, item.id)}>
                    <Input
                      type="text"
                      value={issueTittle}
                      onChange={(e) => setIssueTittle(e.target.value)}
                      placeholder="Issue title"
                    />

                    <Input
                      type="text"
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Issue description"
                    />

                    <DialogFooter>
                      <DialogClose
                        render={
                          <Button variant="outline" type="button">
                            Cancel
                          </Button>
                        }
                      />

                      <Button type="submit">Create Issue</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
