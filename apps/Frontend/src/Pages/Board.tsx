import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type Section = {
  id: string;
  title: string;
  boardId: string;
};

const Board = () => {
  const { boardId } = useParams();
  const [section, setSection] = useState<Section[]>([]);

  const navigate = useNavigate();

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
      console.log("WebSocket Connected..!!");
    };
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
  }, [boardId]);

  return (
    <div>
      {section.length === 0 ? (
        <p>No sections yet</p>
      ) : (
        <div className="flex justify-evenly">
          {section.map((item) => (
            <div key={item.id}>
              <div>{item.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Board;
