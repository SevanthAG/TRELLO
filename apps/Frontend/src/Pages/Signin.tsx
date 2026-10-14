import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Brand from "@/components/Brand";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await api.post<{ token: string }>("/auth/signin", {
        email: email.trim(),
        password,
      });
      if (typeof response.data.token !== "string" || !response.data.token) {
        throw new Error("Missing authentication token");
      }
      localStorage.setItem("token", response.data.token);
      toast.add({ title: "Welcome back", type: "success" });
      navigate("/dashboard", { replace: true });
    } catch {
      toast.add({
        title: "Sign in failed",
        description: "Check your email and password, then try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-decoration" aria-hidden="true">
        <span className="pixel-block pixel-block-grass" />
        <span className="pixel-block pixel-block-stone" />
        <span className="pixel-block pixel-block-earth" />
      </div>
      <section className="auth-card">
        <Brand />
        <div className="auth-copy">
          <p className="eyebrow">Good to see you</p>
          <h1 className="pixel-heading auth-heading">Welcome back</h1>
          <p>Sign in to get back to your team's work.</p>
        </div>
        <form className="form-stack" onSubmit={handleSignin}>
          <div className="field-stack">
            <Label htmlFor="signin-email">Email address</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field-stack">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </div>
          <Button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="auth-switch">
          New to Blockboard? <Link to="/signup">Create an account</Link>
        </p>
      </section>
      <p className="auth-footnote">
        A calmer place to make progress, one block at a time.
      </p>
    </main>
  );
};

export default Signin;
