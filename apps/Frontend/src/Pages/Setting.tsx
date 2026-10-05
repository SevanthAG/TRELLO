import { Button } from "@/components/ui/button"
import {
  Card,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import axios from "axios"
import { useParams } from "react-router"

const Setting = () => {
  const { orgId } = useParams();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER")

  const items = [
    { label: "ADMIN", value: "ADMIN" },
    { label: "MEMBER", value: "MEMBER" },
  ]

  const handleAddmember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {

      const data = {
        email,
        role
      }

      const response = await axios.post(`http://localhost:3000/api/organization/${orgId}/add-member`, data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log(response.data)


    } catch (err) {
      console.log("Error while Adding member", err)
    }

  }

  return (
    <div>
      <h1>Organization Settings</h1>

      <h3>Add Members</h3>
      <Card>
        <form onSubmit={handleAddmember}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter member email"
          />
          <Select
            items={items}
            value={role}
            onValueChange={(value) => {
              if (value !== null) {
                setRole(value)
              }
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button type="submit">Add Member</Button>
        </form>
      </Card>

      <div>
        <p>Members Of organization</p>
      </div>
    </div>
  )
}

export default Setting