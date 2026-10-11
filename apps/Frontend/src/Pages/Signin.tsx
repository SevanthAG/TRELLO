import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const data = {
        email,
        password,
      };

      const response = await api.post("/auth/signin", data);
      const token = response.data.token;

      localStorage.setItem("token", token);
      toast.add({
        title: "Signin successful!",
        description: "Logged in Succssful.",
        type: "success",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.add({
        title: "Signin failed",
        description: "Unable to signin. Please try again.",
        type: "error",
      });
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">SignIn</h2>

      <form onSubmit={handleSignin}>
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
        <Button type="submit">Sign In</Button>
      </form>
            <div className="text-center text-sm text-muted-foreground">
          <p>
            Dont have any account?{" "}
            <Link
              to="/signup"
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

export default Signin;
