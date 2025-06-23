import Message from "../schema/Messages.js";


const createMessage = async (data) => {
    try {
        const res = await Message.create(data)
    } catch (error) {
        console.log(error)
    }
}

export async function messageHandler(socket) {
    socket.on("send-message", async (data) => {
        await createMessage(data)
        socket.emit("receive-message", {
            from: data.from,
            content: data.content,
            to: data.to,
            timeStamp: Date.now()
        });
        socket.in(data.to).emit("receive-message", {
            from: data.from,
            content: data.content,
            to: data.to,
            timeStamp: Date.now()
        });
    });
};
