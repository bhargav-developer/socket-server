import { Router } from "express";
import { DeleteChat, getAUserMessage, getUserChatsList } from "../controller/messageController";

const messageRouter = Router()

messageRouter.get("/chats",getUserChatsList)
messageRouter.delete("/deleteChat",DeleteChat)
messageRouter.delete("/getMessage",getAUserMessage)



export default messageRouter





