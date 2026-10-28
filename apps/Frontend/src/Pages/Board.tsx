import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
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
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<Section[]>([]);

  const [issue, setIssue] = useState<Issue[]>([]);

  const navigate = useNavigate();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:3000?token=${encodeURIComponent(token)}`,
    );

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join_room",
          boardId: boardId,
        }),
      );
    };

    socket.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.type == "section_added") {
        setSection((prev) => [...prev, parsedData.payload]);
      }
    };

    socketRef.current = socket;
  }, []);

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
        setIssue(response.data.issues);
      } catch (err) {
        toast.add({ title: "Failed to load issues", type: "error" });
      }
    };

    getIssues();
  }, [boardId]);

  const handleCreateSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socketRef.current?.send(
      JSON.stringify({
        type: "add_section",
        boardId,
        payload: {
          title: title,
        },
      }),
    );
  };

  return (
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
              <div key={item.id}>
                <div>{item.title}</div>
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
