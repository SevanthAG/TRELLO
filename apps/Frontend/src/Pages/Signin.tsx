import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate  = useNavigate();
  const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();

      const data = {
        email,
        password
      }

      const response  = await axios.post('http://localhost:3000/api/auth/signin', data);
      const token = response.data.token;

      localStorage.setItem('token', token);

      console.log("Signin successful:", response.data);

      navigate('/dashboard');
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };
  return (  

    <div>
      <h1>Sign In</h1>

      <form onSubmit={handleSignin}>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Sign In</Button>
      </form>
    </div>
  )
}

export default Signin