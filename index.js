import e from "express";
import http from 'http';
import { Server } from 'socket.io';

const app = e();
const PORT = 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // change this to your frontend's origin
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(userId, "joined");
  });

  socket.on("send-message", (data) => {
    console.log("Message received:", data);
    io.to(data.to).emit("receive-message", {
    from: data.from,
    content: data.content,
    to: data.to
  });

  // Emit to sender
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
