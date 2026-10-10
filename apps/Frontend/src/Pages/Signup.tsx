import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 

  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = {
        email,
        password
      }

      const response = await axios.post('http://localhost:3000/api/auth/signup', data);
      
      console.log("Signup successful:", response.data);
      
      navigate('/signin');


    } catch (error) {
      console.error("Error during signup:", error);
    }
  }

  return (
    <div>
      <h2>Signup</h2>

      <form onSubmit={handleSubmit}>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Signup</Button>
      </form>
      <div>
        <p>Already have an account? <Link to="/signin">Sign in</Link></p>
      </div>
    </div>
  )
}

export default Signup