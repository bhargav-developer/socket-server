import { Router } from "express";
import { DeleteChat, getAUserMessage, getUserChatsList } from "../controller/messageController.js";

const messageRouter = Router()

messageRouter.get("/chats",getUserChatsList)
messageRouter.delete("/deleteChat",DeleteChat)
messageRouter.get("/getMessage",getAUserMessage)



export default messageRouter





