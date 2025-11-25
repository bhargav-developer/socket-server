import crypto from "crypto";
import fileTransferStore from "../stores/fileTransferStore.js";
import userSockets from "../stores/userSocketStore.js";

export function fileHandler(io, socket) {

  // ============= REQUEST FILE TRANSFER ================
  socket.on("sender-file-transfer-req", (data) => {
    const roomId = crypto.randomUUID();
    const receiverSocketId = userSockets.get(data.receiverId);

    if (!receiverSocketId) return;

    // store transfer session
    fileTransferStore.set(roomId, {
      senderId: socket.id,
      receiverId: receiverSocketId,
    });

    // notify receiver
    io.to(receiverSocketId).emit("receiver-file-transfer-request", {
      senderName: data.name,
      senderId: data.senderId,
      roomId
    });
  });


  // ============= METADATA ================
  socket.on("file-meta", (data) => {
    const { roomId, fileName, size, fileType } = data;

    const session = fileTransferStore.get(roomId);
    if (!session) return;
    io.to(session.receiverId).emit("meta-transfer", {
      roomId,
      fileName,
      size,
      fileType
    });
  });


  // ============= ACCEPT TRANSFER ================
  socket.on("accept-file-transfer", (data) => {
    const { roomId } = data;
    const session = fileTransferStore.get(roomId);

    if (!session) return;

    io.to(session.senderId).emit("file-transfer-start", { roomId });
  });


  // ============= REJECT TRANSFER ================
  socket.on("reject-file-transfer", (data) => {
    const senderSocketId = userSockets.get(data.from);
    if (!senderSocketId) return;

    io.to(senderSocketId).emit("rejected-file-transfer", data.userName);
  });

  socket.on("chunk-ack", (data) => {
    const { roomId } = data
    const session = fileTransferStore.get(roomId);
    if (!session) return;
    console.log("data = ", session)
    socket.to(session.senderId).emit("chunk-ack", data);
  });


  // ============= RECEIVE CHUNK ================
  socket.on("send-file-chunk", (data) => {
    const { roomId, buffer, fileName } = data;

    const session = fileTransferStore.get(roomId);
    if (!session) return;

    io.to(session.receiverId).emit("receive-file-chunk", {
      chunk: buffer,
      fileName
    });
  });


  // ============= END FILE ================
  socket.on("file-end", (data) => {
    const { roomId, fileName, fileType } = data;

    const session = fileTransferStore.get(roomId);
    if (!session) return;

    io.to(session.receiverId).emit("file-transfer-end", {
      roomId,
      fileName,
      fileType
    });
  });


  // ============= CLOSE SESSION ================
  socket.on("close-file-transfer", ({ roomId }) => {
    const session = fileTransferStore.get(roomId);
    if (!session) return;
    io.to(session.senderId).emit("close-file-transfer");
    io.to(session.receiverId).emit("close-file-transfer");
    console.log(session.senderId)
    fileTransferStore.delete(roomId);
  });

}
