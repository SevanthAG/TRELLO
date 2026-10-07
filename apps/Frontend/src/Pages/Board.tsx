import axios from "axios"
import { useEffect, useState } from "react"
import { useParams } from "react-router"

const Board = () => {
    const { orgId, boardId } = useParams();
    const [title, setTitle] = useState("")

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
                setTitle(response.data.board.title)
            } catch (err) {
                console.log(err)
            }
        }
        getBoardById();
    })
    return (
        <div>
            <h1 className="text-center text-5xl">{title}</h1>
        </div>
    )
}

export default Board