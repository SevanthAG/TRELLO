import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

const Signup = () => {
  return (
    <div>
        <h1>Signup</h1>
        <label>Email</label>
        <Input />

        <label>Password</label>
        <Input />

        <Button>Signup</Button>

    </div>
  )
}

export default Signup