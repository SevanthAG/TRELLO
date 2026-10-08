import { Button } from "@/components/ui/button";
import axios from "axios"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";

const Board = () => {


    type Section = {
        id: number
        title: string
        boardId: number
    }

    const { orgId, boardId } = useParams();
    const [boardTitle, setBoardTitle] = useState("")
    const [title, setTitle] = useState("")
    const [section, setSection] = useState<Section[]>([])

    useEffect(() => {
        const getBoardById = async () => {
            const token = localStorage.getItem("token")
            try {
                const response = await axios.get(`http://localhost:3000/api/board?orgId=${orgId}&boardId=${boardId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                const data = response.data.board;
                setBoardTitle(data.title)
            } catch (err) {
                console.log(err)
            }
        }
        getBoardById();
    }, [boardId])


    useEffect(() => {
        const getSection = async () => {
            const token = localStorage.getItem("token")
            try {
                const response = await axios.get(`http://localhost:3000/api/board/${boardId}/sections`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                const data = response.data
                console.log(data.sections)
                setSection(data.sections)
            } catch (err) {
                console.log(err)
            }
        }
        getSection();
    }, [boardId])

    const handleCreateSection = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const data = {
                title: title
            }
            const response = await axios.post(`http://localhost:3000/api/board/${boardId}/sections`, data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            console.log(response.data)
        } catch (err) {
            console.log("Error While creating Board", err)
        }
    }
    return (
        <div>
            <div className="flex gap-1.5 justify-between">
                <h1>{boardTitle}</h1>
                <div>
                    <Dialog>
                        <DialogTrigger
                            render={
                                <Button variant="outline">
                                    Create Section
                                </Button>
                            }
                        />
                        <DialogContent className="sm:max-w-sm">
                            <form onSubmit={handleCreateSection}>
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
            </div>

            <div className="flex gap-4 mt-6 overflow-x-auto">
                {section.map((item) => (
                    <div
                        key={item.id}
                        className="w-72 min-w-72 rounded-lg border bg-muted p-4"
                    >
                        <h2 className="font-semibold text-lg">
                            {item.title}
                        </h2>
                    </div>
                ))}
            </div>

        </div>
    )
}

export default Board