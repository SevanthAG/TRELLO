import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TriangleAlert,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/toast";
import AuthShell from "../components/auth/AuthShell";
import { api } from "../api/axios";
import { getAuthErrorMessage } from "../lib/auth-error";
import {
  passwordScore,
  validateSignup,
  type SignupErrors,
} from "../lib/auth-validation";


// Password Strength
const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
];

// If field is Missing 
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold text-red-600">
      <TriangleAlert className="size-3.5" strokeWidth={2.5} />
      {message}
    </p>
  );
}

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [loading, setLoading] = useState(false);

  const { username, email, password } = form;
  const score = passwordScore(password);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateSignup({ username, email, password });
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.add({
        title: "Please review your details",
        description: "Fix the highlighted fields to continue.",
        type: "error",
      });
      return;
    }

    if (!agreed) {
      toast.add({
        title: "Terms required",
        description: "Please accept the Terms and Privacy Policy to continue.",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/signup", {
        username: username.trim(),
        email: email.trim(),
        password,
      });
      toast.add({
        title: "Account created",
        description: "Your account is ready. Please sign in.",
        type: "success",
      });
      navigate("/signin", { state: { email: email.trim() } });
    } catch (error) {
      toast.add({
        title: "Sign up failed",
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
      eyebrow="GET STARTED"
      title="Create your account"
      subtitle="Start organizing your work in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-bold text-red-600 underline decoration-2 underline-offset-4 hover:text-red-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} noValidate className="space-y-4">
        <div>
          <label htmlFor="username" className="text-sm font-extrabold">
            Name
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" strokeWidth={2.5} />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Your name"
              value={username}
              onChange={(e) => updateField("username", e.target.value)}
              aria-invalid={Boolean(errors.username)}
              className={inputClass(errors.username)}
            />
          </div>
          <FieldError message={errors.username} />
        </div>

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
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
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
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < score ? STRENGTH_COLORS[score - 1] : "bg-neutral-200"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs font-extrabold text-neutral-600">
                {STRENGTH_LABELS[Math.max(0, score - 1)]}
              </span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs font-bold text-neutral-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 accent-red-600"
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl border-2 border-black bg-red-600 font-block text-sm tracking-widest text-white shadow-[0_4px_0_#000] transition-all hover:bg-red-500 active:translate-y-0.5 active:shadow-none disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" /> CREATING ACCOUNT...
            </>
          ) : (
            "SIGN UP"
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Signup;
