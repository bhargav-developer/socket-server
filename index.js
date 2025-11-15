import e from "express";
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from "dotenv";
import cors from 'cors'
import messageRouter from "./routes/messageRoutes.js";
import { messageHandler } from "./socketEvenHandlers/messages.js";
import { fileHandler } from "./socketEvenHandlers/file.js";
config()

const MONGODB_URI = process.env.MONGODB_URI;


if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

mongoose.connect(MONGODB_URI).then((next, err) => {
  if (err) {
    console.log(err)
  }
  console.log("connected to db")
})


const app = e();
const PORT = 4000;

const server = http.createServer(app);

app.use(cors())

app.get("/",() => {
  return "Hello world"
})

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const onlineUsers = new Map()

app.use("/messages", messageRouter)
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  messageHandler(socket)
  fileHandler(socket)
  socket.on("join", (userId) => {
    socket.userId = userId
    socket.join(userId);
    
    onlineUsers.set(socket.userId,{
      online: true
    })
    const obj = Object.fromEntries(onlineUsers);
    io.emit("update_users",obj)
    console.log(userId, "joined");
  });

  




  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    onlineUsers.set(socket.userId,{
      online: false,
      lastSeen: Date.now()
    })
   const obj = Object.fromEntries(onlineUsers);
    io.emit("update_users",obj)
  });
});

server.listen(PORT, () => {
  console.log(`Socket server is running on port ${PORT}`);
});
