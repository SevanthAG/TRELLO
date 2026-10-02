import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TriangleAlert,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/toast";
import AuthShell from "../components/auth/AuthShell";
import { api } from "../api/axios";
import { getAuthErrorMessage } from "../lib/auth-error";
import { validateSignin, type SigninErrors } from "../lib/auth-validation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold text-red-600">
      <TriangleAlert className="size-3.5" strokeWidth={2.5} />
      {message}
    </p>
  );
}

const Signin = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { email?: string } };
  const [form, setForm] = useState({
    email: location.state?.email ?? "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<SigninErrors>({});
  const [loading, setLoading] = useState(false);

  const { email, password } = form;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSignin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateSignin({ email, password });
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.add({
        title: "Please review your details",
        description: "Fix the highlighted fields to continue.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<{ token?: string }>("/signin", {
        email: email.trim(),
        password,
      });
      const token = data.token;
      if (token) {
        if (remember) localStorage.setItem("token", token);
        else sessionStorage.setItem("token", token);
      }
      toast.add({
        title: "Welcome back",
        description: "You have signed in successfully.",
        type: "success",
      });
      navigate("/organization");
    } catch (error) {
      toast.add({
        title: "Sign in failed",
        description: getAuthErrorMessage(error),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `h-12 border-2 bg-white pl-10 font-semibold shadow-[3px_3px_0_#000] placeholder:font-semibold placeholder:text-neutral-400 focus-visible:ring-0 ${
      hasError
        ? "border-red-600 focus-visible:border-red-600"
        : "border-black focus-visible:border-red-600"
    }`;

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in"
      subtitle="Continue to your boards."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-bold text-red-600 underline decoration-2 underline-offset-4 hover:text-red-700"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignin} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-extrabold">
            Email
          </label>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" strokeWidth={2.5} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
              className={inputClass(errors.email)}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-extrabold">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" strokeWidth={2.5} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => updateField("password", e.target.value)}
              aria-invalid={Boolean(errors.password)}
              className={`${inputClass(errors.password)} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-1.5 text-neutral-600 hover:text-neutral-900"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <div className="flex items-center justify-between text-sm font-bold">
          <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-red-600"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() =>
              toast.add({
                title: "Password reset",
                description: "Password reset isn't available yet. Please contact support.",
                type: "info",
              })
            }
            className="underline decoration-2 underline-offset-4 hover:text-red-600"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl border-2 border-black bg-red-600 font-block text-sm tracking-widest text-white shadow-[0_4px_0_#000] transition-all hover:bg-red-500 active:translate-y-0.5 active:shadow-none disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" /> SIGNING IN...
            </>
          ) : (
            "SIGN IN"
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Signin;
