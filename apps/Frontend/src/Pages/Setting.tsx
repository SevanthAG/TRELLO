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
import { useEffect, useState } from "react"
import axios from "axios"
import { useParams } from "react-router"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Setting = () => {

  type Member = {
    id: number,
    username: string,
    email: string,
    role: string
  }

  const { orgId } = useParams();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER")

  const [member, setMember] = useState<Member[]>([])

  const items = [
    { label: "ADMIN", value: "ADMIN" },
    { label: "MEMBER", value: "MEMBER" },
  ]


  useEffect(() => {
    const getMembers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(`http://localhost:3000/api/organization/${orgId}/getMembers`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        setMember(response.data.membership)
      } catch (err) {
        console.log("error while fetching members", err)
      }
    }
    getMembers()
  }, [])

  const handleAddmember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const data = {
        email,
        role
      }

      const response = await axios.post<Member>(`http://localhost:3000/api/organization/${orgId}/add-member`, data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setMember([...member, response.data])

    } catch (err) {
      console.log("Error while Adding member", err)
    }

  }

  useEffect(() => {
    console.log(member)
  }, [member])

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1>Organization Settings</h1>

      <h3>Add Members</h3>
      <Card className="border rounded-md">
        <form onSubmit={handleAddmember}
          className="flex gap-2">
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">UserId</TableHead>
              <TableHead>UserName</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {member.map((member,i) => (
              <TableRow key={member.id + i}>
                <TableCell>{member.id}</TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </div>
    </div>
  )
}

export default Setting