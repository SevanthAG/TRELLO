import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  FileText,
  Loader2,
  LogOut,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/toast";
import { api } from "../api/axios";
import { getAuthErrorMessage } from "../lib/auth-error";

type OrganizationErrors = {
  orgName?: string;
  description?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
      <TriangleAlert className="size-3.5" strokeWidth={2.5} />
      {message}
    </p>
  );
}

const Organization = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ orgName: "", description: "" });
  const [errors, setErrors] = useState<OrganizationErrors>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSignout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/signin");
  };

  const handleCreateOrganization = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const orgName = form.orgName.trim();
    const description = form.description.trim();
    const nextErrors: OrganizationErrors = {};

    if (!orgName) nextErrors.orgName = "Workspace name is required.";
    if (!description) nextErrors.description = "Description is required.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.add({
        title: "Please complete the form",
        description: "Add a workspace name and description to continue.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/organization/create", { orgName, description });
      setForm({ orgName: "", description: "" });
      toast.add({
        title: "Workspace created",
        description: `${orgName} is ready for your team.`,
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Could not create workspace",
        description: getAuthErrorMessage(error),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `h-11 border bg-white font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-red-500/20 ${
      hasError
        ? "border-red-500 focus-visible:border-red-500"
        : "border-slate-300 focus-visible:border-red-500"
    }`;

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-body text-[#172b4d]">
      <header className="flex h-16 items-center justify-between border-b border-[#dfe1e6] bg-white px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-red-600 font-block text-lg text-white shadow-[2px_2px_0_#172b4d]">
            B
          </span>
          <span className="font-block text-base tracking-wide">
            BLOCK<span className="text-red-600">BOARD</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignout}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#172b4d]"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </header>

      <main className="flex justify-center px-4 py-10 sm:py-16">
        <section className="w-full max-w-lg rounded-xl border border-[#dfe1e6] bg-white shadow-sm">
          <div className="border-b border-[#dfe1e6] px-6 py-6 sm:px-8">
            <div className="mb-4 grid size-11 place-items-center rounded-lg bg-red-50 text-red-600">
              <Building2 className="size-5" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-600">
              Workspace setup
            </p>
            <h1 className="mt-2 font-block text-2xl leading-tight text-[#172b4d] sm:text-3xl">
              Create your workspace
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              Give your team a place to organize projects, boards, and tasks.
            </p>
          </div>

          <form
            onSubmit={handleCreateOrganization}
            noValidate
            className="space-y-5 px-6 py-6 sm:px-8"
          >
            <div>
              <label
                htmlFor="orgName"
                className="text-sm font-extrabold text-[#172b4d]"
              >
                Workspace name
              </label>
              <div className="relative mt-2">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="orgName"
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. Acme Studio"
                  value={form.orgName}
                  onChange={(e) => updateField("orgName", e.target.value)}
                  aria-invalid={Boolean(errors.orgName)}
                  className={`${inputClass(errors.orgName)} pl-10`}
                />
              </div>
              <FieldError message={errors.orgName} />
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-extrabold text-[#172b4d]"
              >
                Description
              </label>
              <div className="relative mt-2">
                <FileText className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
                <textarea
                  id="description"
                  rows={4}
                  placeholder="What will your team organize here?"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  aria-invalid={Boolean(errors.description)}
                  className={`w-full resize-none rounded-md border bg-white py-3 pl-10 pr-3 text-sm font-medium text-[#172b4d] outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${
                    errors.description ? "border-red-500" : "border-slate-300"
                  }`}
                />
              </div>
              <FieldError message={errors.description} />
            </div>

            <div className="border-t border-[#dfe1e6] pt-5">
              <p className="mb-4 text-xs font-medium text-slate-500">
                You can update these details and invite teammates later.
              </p>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-red-600 font-extrabold text-white shadow-sm hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create workspace
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Organization;
