import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Users } from "lucide-react";
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

type Member = {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
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

const isMember = (value: unknown): value is Member =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "email" in value &&
  typeof value.email === "string" &&
  "role" in value &&
  (value.role === "ADMIN" || value.role === "MEMBER");

const Setting = () => {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("MEMBER");
  const [editOpen, setEditOpen] = useState(false);
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!orgId) return;
    setLoadError(false);
    try {
      const [organizationResponse, memberResponse] = await Promise.all([
        api.get<{ organizations: Organization[] }>("/organization"),
        api.get<{ membership: Member[] }>(`/member/${orgId}`),
      ]);
      if (
        !Array.isArray(organizationResponse.data.organizations) ||
        !organizationResponse.data.organizations.every(isOrganization) ||
        !Array.isArray(memberResponse.data.membership) ||
        !memberResponse.data.membership.every(isMember)
      ) {
        throw new Error("Invalid organization settings response");
      }
      const currentOrganization = organizationResponse.data.organizations.find(
        (item) => item.id === orgId,
      );
      if (!currentOrganization) {
        setLoadError(true);
        toast.add({
          title: "Organization not found in your workspaces",
          type: "error",
        });
        return;
      }
      setOrganization(currentOrganization);
      setMembers(memberResponse.data.membership);
    } catch {
      setLoadError(true);
      toast.add({
        title: "Could not load organization settings",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
  }, [loadSettings]);

  const handleUpdateOrganization = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!orgId || savingOrganization) return;
    const nextName = orgName.trim();
    const nextDescription = description.trim();
    if (!nextName && !nextDescription) {
      toast.add({
        title: "Enter a name or description to update",
        type: "error",
      });
      return;
    }

    setSavingOrganization(true);
    try {
      const response = await api.patch<{ updatedOrganization: Organization }>(
        `/organization/${orgId}`,
        {
          ...(nextName ? { orgName: nextName } : {}),
          ...(nextDescription ? { description: nextDescription } : {}),
        },
      );
      if (!isOrganization(response.data.updatedOrganization)) {
        throw new Error("Invalid organization update response");
      }
      setOrganization(response.data.updatedOrganization);
      setOrgName("");
      setDescription("");
      setEditOpen(false);
      toast.add({ title: "Organization updated", type: "success" });
    } catch (error) {
      let message = "Could not update organization";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403)
          message = "Only organization admins can update settings";
        if (error.response?.status === 404)
          message = "Organization no longer exists";
      }
      toast.add({ title: message, type: "error" });
    } finally {
      setSavingOrganization(false);
    }
  };

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orgId || addingMember) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.add({ title: "Enter an email address", type: "error" });
      return;
    }

    setAddingMember(true);
    try {
      const response = await api.post<{ member: Member }>(`/member/${orgId}`, {
        email: normalizedEmail,
        role,
      });
      if (!isMember(response.data.member)) {
        throw new Error("Invalid membership response");
      }
      setMembers((current) =>
        current.some((member) => member.id === response.data.member.id)
          ? current
          : [...current, response.data.member],
      );
      setEmail("");
      toast.add({ title: "Member added", type: "success" });
    } catch (error) {
      let message = "Could not add member";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404)
          message = "No account found for that email";
        if (error.response?.status === 409)
          message = "That person is already a member";
        if (error.response?.status === 403)
          message = "Only organization admins can add members";
      }
      toast.add({ title: message, type: "error" });
    } finally {
      setAddingMember(false);
    }
  };

  if (loading || organization?.id !== orgId) {
    return (
      <main className="page-stack">
        <div className="state-panel" role="status">
          Loading organization…
        </div>
      </main>
    );
  }

  if (loadError || !organization) {
    return (
      <main className="page-stack">
        <div className="state-panel" role="alert">
          <p>Organization settings could not be loaded.</p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setOrganization(null);
              void loadSettings();
            }}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-stack settings-page">
      <header className="page-heading">
        <div>
          <Link className="back-link" to="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Dashboard
          </Link>
          <p className="eyebrow">Workspace settings</p>
          <h1 className="pixel-heading">{organization.name}</h1>
          <p className="page-intro">{organization.description}</p>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger
            render={<Button variant="outline">Edit organization</Button>}
          />
          <DialogContent className="app-dialog">
            <DialogHeader>
              <p className="eyebrow">Workspace details</p>
              <DialogTitle className="pixel-heading dialog-heading">
                Edit organization
              </DialogTitle>
            </DialogHeader>
            <form className="form-stack" onSubmit={handleUpdateOrganization}>
              <div className="field-stack">
                <Label htmlFor="edit-organization-name">
                  Organization name
                </Label>
                <Input
                  id="edit-organization-name"
                  autoFocus
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder={organization.name}
                />
              </div>
              <div className="field-stack">
                <Label htmlFor="edit-organization-description">
                  Description
                </Label>
                <Input
                  id="edit-organization-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={organization.description}
                />
              </div>
              <p className="field-hint">
                Leave a field blank to keep its current value.
              </p>
              <DialogFooter className="dialog-actions">
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={savingOrganization}>
                  {savingOrganization ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="settings-card" aria-labelledby="members-heading">
        <div className="settings-card-heading">
          <div className="settings-heading-icon" aria-hidden="true">
            <Users />
          </div>
          <div>
            <p className="eyebrow">People</p>
            <h2 id="members-heading" className="section-heading">
              Members
            </h2>
          </div>
          <span className="member-count">{members.length}</span>
        </div>

        <form className="member-form" onSubmit={handleAddMember}>
          <div className="field-stack member-email-field">
            <Label htmlFor="member-email">Invite by email</Label>
            <Input
              id="member-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
            />
          </div>
          <div className="field-stack member-role-field">
            <Label htmlFor="member-role">Role</Label>
            <select
              className="organization-select role-select"
              id="member-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value === "ADMIN" ? "ADMIN" : "MEMBER")
              }
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={addingMember}>
            {addingMember ? "Adding…" : "Add member"}
          </Button>
        </form>

        {members.length === 0 ? (
          <div className="empty-inline">
            <Users aria-hidden="true" />
            <div>
              <h3>No members yet</h3>
              <p>Add someone by email to start collaborating.</p>
            </div>
          </div>
        ) : (
          <div className="member-list">
            <div className="member-list-header" aria-hidden="true">
              <span>Member</span>
              <span>Role</span>
            </div>
            {members.map((member) => (
              <div className="member-row" key={member.id}>
                <span className="member-avatar" aria-hidden="true">
                  {member.email.slice(0, 1).toUpperCase()}
                </span>
                <span className="member-email">{member.email}</span>
                <span
                  className={`role-badge role-${member.role.toLowerCase()}`}
                >
                  {member.role === "ADMIN" ? "Admin" : "Member"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Setting;
