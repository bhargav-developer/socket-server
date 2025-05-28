const { Server } = require("socket.io");

const io = new Server(4000, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("Client connected:", socket.id, "User ID:", userId);

  socket.join(userId);

  socket.on("message", ({ content, to }) => {
    io.to(to).emit("recieve-message", { content });
  });
});
