import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import { Label } from "@/components/ui/label";

type Organization = {
  id: string;
  name: string;
  description: string;
  role: string;
};

type Board = {
  id: number;
  title: string;
  organizationId: number;
};

const Dashboard = () => {
  const [organization, setOrganization] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");

  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");

  const [board, setBoard] = useState<Board[]>([]);
  const [title, setTitle] = useState("");

  const navigate = useNavigate();

  const handleCreateOrganization = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      const data = {
        orgName: orgName,
        description: description,
      };

      if (!orgName.trim() || !description.trim()) {
        toast.add({
          title: "Both Field Are required",
          description: "Missing orgName or Description",
          type: "error",
        });
        return;
      }

      const response = await api.post("/organization", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newOrganization = {
        id: response.data.organization,
        name: orgName,
        description: description,
        role: "ADMIN",
      };

      setOrganization((prev) => [...prev, newOrganization]);

      toast.add({
        title: "Organization Created successfully",
        description: "Created",
        type: "success",
      });

      setOrgName("");
      setDescription("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409)
        toast.add({ title: "Organization already exists", type: "error" });
      else toast.add({ title: "Failed to create", type: "error" });
    }
  };

  useEffect(() => {
    const getOrganization = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      try {
        const response = await api.get("/organization", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrganization(response.data.organizations);
      } catch (err) {
        toast.add({ title: "Failed to load organizations", type: "error" });
      }
    };
    getOrganization();
  }, []);

  useEffect(() => {
    if (selectedOrganization === "") {
      return;
    }
    const getBoard = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `http://localhost:3000/api/board/${selectedOrganization}/boards`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setBoard(response.data.boards);
      } catch (err) {
        console.log(err);
      }
    };
    getBoard();
  }, [selectedOrganization]);

  const handleCreateBoard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const data = {
        title,
      };

      const response = await axios.post(
        `http://localhost:3000/api/board/${selectedOrganization}/board`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(response.data);

      const newBoard = {
        id: response.data.board.id,
        title: response.data.board.title,
        organizationId: response.data.organizationId,
      };

      setBoard([...board, newBoard]);

      // console.log(board);
    } catch (err) {
      console.log("Error while Creating Board", err);
    }
  };

  return (
    <div className="m-5 p-4">
      <div className="flex justify-between w-full">
        <h1 className="text-5xl">Dashboard</h1>

        <div>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline">
                  <Plus />
                  Create Organization
                </Button>
              }
            />

            <DialogContent className="sm:max-w-sm">
              <form
                onSubmit={handleCreateOrganization}
                className="flex flex-col gap-3 m-5"
              >
                <Label>Organization Name: </Label>
                <Input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />

                <Label>Organization Description: </Label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <DialogFooter>
                  <Button type="submit">Create Organization</Button>
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

      <div className="flex justify-center">
        <Select
          value={selectedOrganization}
          onValueChange={(value) => {
            if (value !== null) {
              setSelectedOrganization(value);
            }
          }}
        >
          <SelectTrigger className="w-80 text-2xl">
            <SelectValue placeholder="Select Organization">
              {organization.find(org => org.id === selectedOrganization)?.name}
              </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {organization.length === 0 && (
              <p className="text-md p-5 text-center">No organizations — create one above</p>
            )}
            <SelectGroup>
              {organization.map((org) => (
                <SelectItem key={org.id} value={org.id} >
                  {org.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => {
          navigate(`/organization/${selectedOrganization}/settings`);
        }}
      >
        Settings
      </Button>

      <div>
        <Dialog>
          <DialogTrigger
            render={<Button variant="outline">Create Board</Button>}
          />
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleCreateBoard}>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <DialogFooter>
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit">Create Board</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {board.map((board) => (
        <Card
          size="sm"
          className="mx-auto w-full max-w-xs"
          onClick={() => {
            navigate(`/organization/${board.organizationId}/board/${board.id}`);
          }}
          key={board.id}
        >
          <CardTitle>{board.title}</CardTitle>
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;
