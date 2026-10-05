import axios from "axios"
import { useEffect } from "react"
import { useParams } from "react-router"

const Board = () => {
    const { orgId ,boardId } = useParams();

    useEffect(()=>{
        const getBoardById = async ()=>{
            try{
                const response = await axios.get(``)
            }catch(err){
                console.log(err)
            }
        }
    })
  return (
    <div></div>
  )
}

export default Board