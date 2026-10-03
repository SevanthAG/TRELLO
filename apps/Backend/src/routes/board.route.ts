import { Router } from "express";

const boardRoute = Router();


boardRoute.post("/board", (req, res) => {
    const userId = req.userId;
    const { title } = req.body;
    

})
boardRoute.get("/boards", (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

})
export default boardRoute;