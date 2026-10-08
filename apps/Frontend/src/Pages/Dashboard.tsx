import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'


const Dashboard = () => {

    type Organization = {
        id: number
        name: string
        description: string
        role: string
    }

    type Board = {
        id: number
        title: string
        organizationId: number
    }

    const [selectedOrganization, setSelectedOrganization] = useState("")
    const [organization, setOrganization] = useState<Organization[]>([])

    const [orgName, setOrgName] = useState("")
    const [description, setDescription] = useState("")

    const [board, setBoard] = useState<Board[]>([])
    const [title, setTitle] = useState("")

    const navigate = useNavigate();

    useEffect(() => {
        const getOrganization = async () => {
            const token = localStorage.getItem("token")
            try {
                const response = await axios.get(
                    "http://localhost:3000/api/organization/get-organizations",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                setOrganization(response.data.organizations)
            } catch (err) {
                console.log("Error ", err)
            }
        }
        getOrganization();
    }, [])

    useEffect(() => {

        if (selectedOrganization === "") {
            return;
        }
        const getBoard = async () => {
            const token = localStorage.getItem("token")
            try {
                const response = await axios.get(`http://localhost:3000/api/board/${selectedOrganization}/boards`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                setBoard(response.data.boards)
                // console.log(response.data.boards)
            } catch (err) {
                console.log(err);
            }
        }
        getBoard();

    }, [selectedOrganization])

    const handleCreateOrganization = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const data = {
                orgName: orgName,
                description: description
            }

            const response = await axios.post("http://localhost:3000/api/organization/create", data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const newOrganization = {
                id: response.data.organization.id,
                name: response.data.organization.name,
                description: response.data.organization.description,
                role: response.data.membership.role
            }

            setOrganization([...organization, newOrganization])
        } catch (err) {
            console.log("Eror while creating Organization", err)
        }
    }


    const handleCreateBoard = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const token = localStorage.getItem("token")
        try {
            const data = {
                title
            }

            const response = await axios.post(`http://localhost:3000/api/board/${selectedOrganization}/board`, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            console.log(response.data)

            const newBoard = {
                id: response.data.board.id,
                title: response.data.board.title,
                organizationId: response.data.organizationId
            }

            setBoard([...board, newBoard])

            // console.log(board);
        } catch (err) {
            console.log("Error while Creating Board", err)
        }
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <Button onClick={()=>{
                navigate(`/organization/${selectedOrganization}/settings`);
            }}>Settings</Button>
            <div>
                <Select
                    value={selectedOrganization}
                    onValueChange={(value) => {
                        if (value !== null) {
                            setSelectedOrganization(value)
                        }
                    }}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {organization.map((org) => (
                                <SelectItem
                                    key={org.id}
                                    value={String(org.id)}
                                >
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>


            <div>
                <Dialog>
                    <DialogTrigger
                        render={
                            <Button variant="outline">
                                Create Organization
                            </Button>
                        }
                    />

                    <DialogContent className="sm:max-w-sm">

                        <form onSubmit={handleCreateOrganization}>

                            <Input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            />

                            <Input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <DialogFooter>

                                <DialogClose
                                    render={
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    }
                                />

                                <Button type="submit">
                                    Create Organization
                                </Button>

                            </DialogFooter>

                        </form>

                    </DialogContent>
                </Dialog>
            </div>

            <div>
                <Dialog>
                    <DialogTrigger
                        render={
                            <Button variant="outline">
                                Create Board
                            </Button>
                        }
                    />
                    <DialogContent className="sm:max-w-sm">
                        <form onSubmit={handleCreateBoard}>
                            <Input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <DialogFooter>
                                <DialogClose
                                    render={
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    }
                                />
                                <Button type="submit">
                                    Create Board
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {board.map((board) => (
                <Card size="sm" className="mx-auto w-full max-w-xs" onClick={()=>{
                    navigate(`/organization/${board.organizationId}/board/${board.id}`)
                }} key={board.id}>
                    <CardTitle>{board.title}</CardTitle>
                </Card>      
            ))}

        </div>
    )
}

export default Dashboard