import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, FolderKanban, Plus, Settings2 } from "lucide-react";
import axios from "axios";
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
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";

type Organization = {
  id: string;
  name: string;
  description: string;
};

type Board = {
  id: string;
  title: string;
  organizationId: string;
};

const isOrganization = (value: unknown): value is Organization =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "name" in value &&
  typeof value.name === "string" &&
  "description" in value &&
  typeof value.description === "string";

const isBoard = (value: unknown): value is Board =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "title" in value &&
  typeof value.title === "string" &&
  "organizationId" in value &&
  typeof value.organizationId === "string";

const Dashboard = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState(false);
  const [boardsRefresh, setBoardsRefresh] = useState(0);
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);

  const navigate = useNavigate();

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await api.get<{ organizations: Organization[] }>(
        "/organization",
      );
      if (
        !Array.isArray(response.data.organizations) ||
        !response.data.organizations.every(isOrganization)
      ) {
        throw new Error("Invalid organizations response");
      }
      setOrganizations(response.data.organizations);
    } catch {
      setOrganizationsError(true);
      toast.add({ title: "Could not load organizations", type: "error" });
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadOrganizations);
  }, [loadOrganizations]);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let active = true;
    const loadBoards = async () => {
      setBoardsLoading(true);
      try {
        const response = await api.get<{ boards: Board[] }>(
          `/board/${selectedOrganizationId}`,
        );
        if (
          !Array.isArray(response.data.boards) ||
          !response.data.boards.every(isBoard)
        ) {
          throw new Error("Invalid boards response");
        }
        if (active) setBoards(response.data.boards);
      } catch {
        if (active) {
          setBoardsError(true);
          toast.add({ title: "Could not load boards", type: "error" });
        }
      } finally {
        if (active) setBoardsLoading(false);
      }
    };
    void loadBoards();
    return () => {
      active = false;
    };
  }, [selectedOrganizationId, boardsRefresh]);

  const handleCreateOrganization = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const name = organizationName.trim();
    const description = organizationDescription.trim();
    if (creatingOrganization) return;
    if (!name || !description) {
      toast.add({
        title: "Enter an organization name and description",
        type: "error",
      });
      return;
    }

    setCreatingOrganization(true);
    try {
      const response = await api.post<{ organization: string }>(
        "/organization",
        {
          orgName: name,
          description,
        },
      );
      if (
        typeof response.data.organization !== "string" ||
        !response.data.organization
      ) {
        throw new Error("Invalid organization creation response");
      }
      const newOrganization = {
        id: response.data.organization,
        name,
        description,
      };
      setOrganizations((current) => [...current, newOrganization]);
      setBoards([]);
      setBoardsError(false);
      setSelectedOrganizationId(newOrganization.id);
      setOrganizationName("");
      setOrganizationDescription("");
      setOrganizationDialogOpen(false);
      toast.add({ title: "Organization created", type: "success" });
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "An organization with that name already exists"
          : "Could not create organization";
      toast.add({ title: message, type: "error" });
    } finally {
      setCreatingOrganization(false);
    }
  };

  const handleCreateBoard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = boardTitle.trim();
    if (creatingBoard) return;
    if (!title || !selectedOrganizationId) {
      toast.add({
        title: !selectedOrganizationId
          ? "Choose an organization first"
          : "Enter a board name",
        type: "error",
      });
      return;
    }

    setCreatingBoard(true);
    try {
      const response = await api.post<{ newBoard: Board }>(
        `/board/${selectedOrganizationId}`,
        { title },
      );
      if (!isBoard(response.data.newBoard)) {
        throw new Error("Invalid board creation response");
      }
      setBoards((current) => [...current, response.data.newBoard]);
      setBoardTitle("");
      setBoardDialogOpen(false);
      toast.add({ title: "Board created", type: "success" });
    } catch (error) {
      let message = "Could not create board";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409)
          message = "That board title is already in use";
        if (error.response?.status === 403)
          message = "Only organization admins can create boards";
      }
      toast.add({ title: message, type: "error" });
    } finally {
      setCreatingBoard(false);
    }
  };

  const selectedOrganization = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );

  return (
    <main className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="pixel-heading">Dashboard</h1>
          <p className="page-intro">Pick up where your team left off.</p>
        </div>
        <Dialog
          open={organizationDialogOpen}
          onOpenChange={setOrganizationDialogOpen}
        >
          <DialogTrigger
            render={
              <Button variant="outline" className="action-button">
                <Plus aria-hidden="true" />
                New organization
              </Button>
            }
          />
          <DialogContent className="app-dialog">
            <DialogHeader>
              <p className="eyebrow">Workspace setup</p>
              <DialogTitle className="pixel-heading dialog-heading">
                Create an organization
              </DialogTitle>
            </DialogHeader>
            <form className="form-stack" onSubmit={handleCreateOrganization}>
              <div className="field-stack">
                <Label htmlFor="organization-name">Organization name</Label>
                <Input
                  id="organization-name"
                  autoFocus
                  required
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="e.g. Redstone Studio"
                />
              </div>
              <div className="field-stack">
                <Label htmlFor="organization-description">Description</Label>
                <Input
                  id="organization-description"
                  required
                  value={organizationDescription}
                  onChange={(event) =>
                    setOrganizationDescription(event.target.value)
                  }
                  placeholder="What is this team working on?"
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
                <Button type="submit" disabled={creatingOrganization}>
                  {creatingOrganization ? "Creating…" : "Create organization"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section
        className="organization-panel"
        aria-labelledby="organization-label"
      >
        <div className="organization-select-wrap">
          <label
            id="organization-label"
            className="eyebrow"
            htmlFor="organization-select"
          >
            Active organization
          </label>
          <select
            className="organization-select"
            id="organization-select"
            value={selectedOrganizationId}
            onChange={(event) => {
              setBoards([]);
              setBoardsError(false);
              setSelectedOrganizationId(event.target.value);
            }}
            disabled={organizationsLoading || organizations.length === 0}
          >
            <option value="">
              {organizationsLoading
                ? "Loading organizations…"
                : "Choose an organization"}
            </option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        {selectedOrganization && (
          <>
            <p className="organization-description">
              {selectedOrganization.description}
            </p>
            <Button
              variant="outline"
              className="action-button settings-button"
              onClick={() =>
                navigate(`/organization/${selectedOrganization.id}/settings`)
              }
            >
              <Settings2 aria-hidden="true" />
              Settings
            </Button>
          </>
        )}
      </section>

      {organizationsError && (
        <div className="state-panel" role="alert">
          <p>Organizations could not be loaded.</p>
          <Button
            variant="outline"
            onClick={() => {
              setOrganizationsLoading(true);
              setOrganizationsError(false);
              void loadOrganizations();
            }}
          >
            Try again
          </Button>
        </div>
      )}
      {!organizationsLoading &&
        !organizationsError &&
        organizations.length === 0 && (
          <section className="empty-panel">
            <span className="empty-icon" aria-hidden="true">
              <FolderKanban />
            </span>
            <h2 className="section-heading">Start with a workspace</h2>
            <p>
              Create an organization to bring your team and boards together.
            </p>
            <Button onClick={() => setOrganizationDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Create organization
            </Button>
          </section>
        )}

      {selectedOrganization && (
        <section className="boards-section" aria-labelledby="boards-heading">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Inside {selectedOrganization.name}</p>
              <h2 id="boards-heading" className="section-heading">
                Boards
              </h2>
            </div>
            <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="action-button">
                    <Plus aria-hidden="true" />
                    New board
                  </Button>
                }
              />
              <DialogContent className="app-dialog">
                <DialogHeader>
                  <p className="eyebrow">A new place to plan</p>
                  <DialogTitle className="pixel-heading dialog-heading">
                    Create a board
                  </DialogTitle>
                </DialogHeader>
                <form className="form-stack" onSubmit={handleCreateBoard}>
                  <div className="field-stack">
                    <Label htmlFor="board-title">Board name</Label>
                    <Input
                      id="board-title"
                      autoFocus
                      required
                      value={boardTitle}
                      onChange={(event) => setBoardTitle(event.target.value)}
                      placeholder="e.g. Product roadmap"
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
                    <Button type="submit" disabled={creatingBoard}>
                      {creatingBoard ? "Creating…" : "Create board"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {boardsLoading ? (
            <div className="state-panel" role="status">
              Loading boards…
            </div>
          ) : boardsError ? (
            <div className="state-panel" role="alert">
              <p>Boards could not be loaded.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setBoardsError(false);
                  setBoardsRefresh((current) => current + 1);
                }}
              >
                Try again
              </Button>
            </div>
          ) : boards.length === 0 ? (
            <div className="empty-inline">
              <FolderKanban aria-hidden="true" />
              <div>
                <h3>No boards yet</h3>
                <p>Create the first board for this organization.</p>
              </div>
            </div>
          ) : (
            <div className="board-grid">
              {boards.map((board, index) => (
                <button
                  className={`board-tile board-tile-${index % 4}`}
                  key={board.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/organization/${board.organizationId}/board/${board.id}`,
                    )
                  }
                >
                  <span className="board-tile-icon" aria-hidden="true">
                    <FolderKanban />
                  </span>
                  <span className="board-tile-title">{board.title}</span>
                  <ArrowUpRight
                    className="board-tile-arrow"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default Dashboard;
