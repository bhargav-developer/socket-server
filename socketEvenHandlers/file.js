import userSockets from "../userSocketStore.js";


export async function fileHandler(socket) {


  socket.on("sender-file-transfer-req", (data) => {
    const roomId = crypto.randomUUID();
    const receiverSocketId = userSockets.get(data.receiverId);
   
    if (!receiverSocketId) return;


    socket.join(roomId);


    socket.to(receiverSocketId).emit("receiver-file-transfer-request", {
      senderName: data.name,
      senderId: data.senderId,
      roomId
    });


    socket.on("file-meta", (data) => {
      socket.in(data.reciverId).emit("meta-transfer", [{
        file: data.name,
        size: data.size,
        fileType: data.fileType
      }])
    })
  });

  socket.on("reject-file-transfer",(data) => {
    const senderSocketId = userSockets.get(data.from);
    socket.to(senderSocketId).emit("rejected-file-transfer",data.userName)
  })



  socket.on("send-file-chunk", (data) => {

    socket.in(data.reciverId).emit("recieve-file-chunk", {
      chunk: data.buffer,
      file: data.name
    })

  });



  socket.on("file-end", (data) => {
    socket.in(data.reciverId).emit("file-transfer-end", {
      name: data.name,
      file: data.name,
      fileType: data.fileType
    })
  })


  socket.on("accept-file-transfer", (data) => {
    const senderSocketId = userSockets.get(data.senderId);
    socket.in(senderSocketId).emit("file-transfer")
  })


}