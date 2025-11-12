export async function fileHandler(socket) {

    socket.on("file-meta", (data) => {
        socket.in(data.reciverId).emit("meta-transfer", [{
            file: data.name,
            size: data.size,
        }])
    })

    socket.on("file-transfer-request", (data) => {
    socket.in(data.reciever).emit("file-transfer-request", {
      sender: data.name,
      senderId: data.sender
    })

  });


  
  socket.on("file-chunk", (data) => {
    socket.in(data.reciverId).emit("recieve-file-chunk", {
      chunk: data.buffer,
      fileName: data.fileName
    })
  });



  socket.on("file-end",(data) => {
    socket.in(data.reciverId).emit("file-transfer-end",{
      name: data.name,
      fileType: data.fileType
    })
  })

  
  socket.on("accept-file-transfer", (data) => {
    console.log("req accepted",data)
    socket.in(data.from).emit("file-transfer")
  })


}