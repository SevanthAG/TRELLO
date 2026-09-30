import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

const Signin = () => {
  return (
    <div>
        <h1>Signin</h1>
        <label>Email</label>
        <Input />

        <label>Password</label>
        <Input />

        <Button>Signin</Button>

    </div>
  )
}

export default Signin