import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";

type Member = {
  id: string;
  email: string;
  role: string;
};

const Setting = () => {
  const { orgId } = useParams();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");

  const [member, setMember] = useState<Member[]>([]);

  const navigate = useNavigate();

  const items = [
    { label: "ADMIN", value: "ADMIN" },
    { label: "MEMBER", value: "MEMBER" },
  ];

  const handleAddmember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    try {
      const data = {
        email,
        role,
      };

      if (!email.trim()) {
        toast.add({
          title: "Email Required",
          type: "error",
        });
        return;
      }

      const response = await api.post(`/member/${orgId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMember((prev) => [...prev, response.data.member]);
      toast.add({
        title: "Member Added",
        type: "success",
      });
      setEmail("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404)
          toast.add({
            title: "User not found — ask them to signup",
            type: "error",
          });
        else if (err.response?.status === 409)
          toast.add({ title: "Already a member", type: "error" });
        else if (err.response?.status === 403)
          toast.add({ title: "Only ADMIN can add", type: "error" });
        else toast.add({ title: "Failed to add", type: "error" });
      }
    }
  };

  useEffect(() => {
    const getMembers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      try {
        const response = await api.get(`/member/${orgId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMember(response.data.membership);
      } catch (err) {
        toast.add({
          title: "Failed to load Members",
          type: "error",
        });
      }
    };
    getMembers();
  }, [orgId]);

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1>Organization Settings</h1>

      <h3>Add Members</h3>
      <Card className="border rounded-md">
        <form onSubmit={handleAddmember} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter member email"
          />
          <Select
            value={role}
            onValueChange={(value) => {
              if (value !== null) {
                setRole(value);
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

        {member.length === 0 ? (
          <p>No members yet — add one above</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-25">UserId</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {member.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.id}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Setting;
