import e from "express";
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from "dotenv";
import Message from "./schema/Messages.js";
import cors from 'cors'
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
  origin: 'http://localhost:3000', // your frontend URL
  credentials: true, // if using cookies or auth headers
}));

// OR, during development only (open to all)
app.use(cors()); // use only in dev

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/messages", async (req, res) => {
  const { from, to } = req.query;
  console.log({ from, to })

  try {
    const messages = await Message.find({
      $or: [
        { from, to },
        { from: to, to: from }
      ]
    }).sort({ timeStamp: 1 }); // 1 = ascending, -1 = descending

    res.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(userId, "joined");
  });

  const createMessage = async (data) => {
    try {
      const res = await Message.create(data)
      console.log(res)

    } catch (error) {
      console.log(error)
    }
  }

  socket.on("send-message", (data) => {

    createMessage(data)

    console.log("Message received:", data);
    io.to(data.to).emit("receive-message", {
      from: data.from,
      content: data.content,
      to: data.to
    });

    io.to(data.from).emit("receive-message", {
      from: data.from,
      content: data.content,
      to: data.to
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket server is running on port ${PORT}`);
});
