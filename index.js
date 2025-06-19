import e from "express";
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from "dotenv";
import Message from "./schema/Messages.js";
import cors from 'cors'
import messageRouter from "./routes/messageRoutes.js";
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

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const onlineUsers = new Map()

app.use("/messages", messageRouter)
let lol = undefined
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

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

  const createMessage = async (data) => {
    try {
      const res = await Message.create(data)
    } catch (error) {
      console.log(error)
    }
  }

  socket.on("send-message", (data) => {

    createMessage(data)
    io.to(data.to).emit("receive-message", {
      from: data.from,
      content: data.content,
      to: data.to,
      timeStamp: Date.now()
    });

    io.to(data.from).emit("receive-message", {
      from: data.from,
      content: data.content,
      to: data.to,
      timeStamp: Date.now()
    });
  });

  socket.on("file-meta", (data) => {
    socket.in(data.reciverId).emit("meta-transfer", [{
      file: data.name,
      size: data.size,
    }])
  })

  socket.on("file-transfer-request", (data) => {

    socket.in(data.reciever).emit("file-transfer-request", {
      sender: data.name
    })

  });

  socket.on("file-chunk", (data) => {
    console.log("file-data", data)
    socket.in(data.recieverId).emit("recieve-file-chunk", {
      fileData: data.fileData
    })

  });

  socket.on("accept-file-transfer", (data) => {
    console.log("req accepted")
    socket.in(data.from).emit("file-transfer")
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    onlineUsers.set(socket.userId,{
      online: false,
      lastSeen: Date.now()
    })
   const obj = Object.fromEntries(onlineUsers);
    io.emit("update_users",obj)
    console.log(onlineUsers)
  });
});

server.listen(PORT, () => {
  console.log(`Socket server is running on port ${PORT}`);
});
