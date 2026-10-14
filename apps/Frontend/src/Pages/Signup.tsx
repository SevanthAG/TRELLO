import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post("/auth/signup", { email: email.trim(), password });
      toast.add({
        title: "Account created",
        description: "Sign in to start setting up your workspace.",
        type: "success",
      });
      navigate("/signin", { replace: true });
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "An account with that email already exists"
          : "Could not create your account. Please try again.";
      toast.add({
        title: "Sign up failed",
        description: message,
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
          <p className="eyebrow">Set up your base</p>
          <h1 className="pixel-heading auth-heading">Make room to build</h1>
          <p>Create an account and bring your team's work together.</p>
        </div>
        <form className="form-stack" onSubmit={handleSignup}>
          <div className="field-stack">
            <Label htmlFor="signup-email">Email address</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field-stack">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </div>
          <Button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </section>
      <p className="auth-footnote">
        A calmer place to make progress, one block at a time.
      </p>
    </main>
  );
};

export default Signup;
