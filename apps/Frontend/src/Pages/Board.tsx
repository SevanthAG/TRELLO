import { useEffect } from "react";
import { useNavigate, useParams } from "react-router"
import { io } from "socket.io-client"


const Board = () => {

  const { boardId } = useParams();
  const navigate = useNavigate();

  useEffect(()=>{
    if(!boardId){
      return;
    }
    const token = localStorage.getItem("token");
    if(!token){
      navigate("/signin")
      return
    }

    const socket = io("http://localhost:8080", 
      {
        auth: {token}
      });
      socket.on("connect", () => {
        socket.emit("board:join", { boardId })
      })

      return () => {
        socket.disconnect();
      }
  }, [boardId])


  return (
    <div>

    </div>
  )
}

export default Board