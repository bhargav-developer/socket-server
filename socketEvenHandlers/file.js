import fileTrasferStore from "../stores/fileTransferStore.js";
import userSockets from "../stores/userSocketStore.js";


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

  socket.on("close-file-transfer", ({ roomId }) => {
  if (!roomId) return;

  const fileTransfer = fileTrasferStore.get(roomId);
  if (!fileTransfer) return;

  const { receiverId, senderId } = fileTransfer;
  console.log(fileTransfer)

  if (receiverId) {
    socket.in(receiverId).emit("close-file-transfer");
    console.log("yes on reciver")
  }

  if (senderId) {
    socket.in(senderId).emit("close-file-transfer");
        console.log("yes on sender")
  }

  fileTrasferStore.delete(roomId); // clean up after close
  console.log("File transfer closed:", roomId,fileTrasferStore);
});


  socket.on("accept-file-transfer", (data) => {
    const senderSocketId = userSockets.get(data.senderId);
    fileTrasferStore.set(data.roomId,{
      senderId: data.senderId,
      receiverId: data.reciverId
    })
    socket.in(senderSocketId).emit("file-transfer",data.roomId)
  })


}