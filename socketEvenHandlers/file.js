import crypto from "crypto";
import fileTransferStore from "../stores/fileTransferStore.js";
import userSockets from "../stores/userSocketStore.js";

export function fileHandler(io, socket) {

  // ============= REQUEST FILE TRANSFER ================
  socket.on("sender-file-transfer-req", (data) => {
    const roomId = crypto.randomUUID();
    const receiverSocketId = userSockets.get(data.receiverId);

    if (!receiverSocketId) return;

    fileTransferStore.set(roomId, {
      senderId: socket.id,
      receiverId: receiverSocketId,
    });

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
  socket.on("accept-file-transfer", ({ roomId }) => {
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


  // ============= CHUNK ACK ================
  socket.on("chunk-ack", ({ roomId }) => {
    const session = fileTransferStore.get(roomId);
    if (!session) return;

    io.to(session.senderId).emit("chunk-ack");
  });


  // ============= RECEIVE CHUNK ================
  socket.on("send-file-chunk", (data) => {
    const { roomId, buffer, fileName } = data;
    const session = fileTransferStore.get(roomId);
    if (!session) return;

    // only the original sender can send chunks
    if (socket.id !== session.senderId) return;

    io.to(session.receiverId).emit("receive-file-chunk", {
      fileName,
      chunk: buffer
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


  // ============= MANUAL CLOSE ================
  socket.on("close-file-transfer", ({ roomId }) => {
    const session = fileTransferStore.get(roomId);
    if (!session) return;

    const { senderId, receiverId } = session;

    io.to(senderId).emit("close-file-transfer");
    io.to(receiverId).emit("close-file-transfer");

    fileTransferStore.delete(roomId);
  });


  // ============= CLEANUP ON DISCONNECT ================
  socket.on("disconnect", () => {
    for (const [roomId, session] of fileTransferStore.entries()) {
      if (session.senderId === socket.id || session.receiverId === socket.id) {
        io.to(session.senderId).emit("close-file-transfer");
        io.to(session.receiverId).emit("close-file-transfer");
        fileTransferStore.delete(roomId);
      }
    }
  });
}
