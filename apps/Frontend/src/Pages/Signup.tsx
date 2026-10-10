import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const data = {
        email,
        password,
      };

      await api.post("/auth/signup", data);

      toast.add({
        title: "Signup successful!",
        description: "Your account has been created.",
        type: "success",
      });

      navigate("/signin");
    } catch (error) {
      console.log("Error during signup:", error);

      toast.add({
        title: "Signup failed",
        description: "Unable to create your account. Please try again.",
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">Signup</h2>

        <form onSubmit={handleSubmit}>
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit">Signup</Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
