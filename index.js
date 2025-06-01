import e from "express";
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from "dotenv";
import Message from "./schema/Messages.js";
import cors from 'cors'
import { ObjectId } from "mongodb";
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


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/messages", async (req, res) => {
  const { from, to } = req.query;

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

app.delete("/messages", async (req, res) => {
  try {
    const {from}  = await req.query;
    if (!from) {
      return res.status(400).json({ error: "'from' query param is required." });
    }

    const deletedMessages = await Message.deleteMany({
     $or: [
    { from },
    { to: from }
  ]
    });

    return res.json({
      message: "Messages deleted successfully.",
      deletedCount: deletedMessages.deletedCount,
    });

  } catch (error) {
    console.error("Error deleting messages:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/chats", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }


  try {
    const contacts = await Message.aggregate([
      // Step 1: Filter messages where user is involved
      {
        $match: {
          $or: [
            { from: userId },
            { to: userId }
          ]
        }
      },
      // Step 2: Compute contact ID (the other user)
      {
        $addFields: {
          contactId: {
            $cond: [
              { $eq: ["$from", userId] },
              "$to",
              "$from"
            ]
          }
        }
      },
      // Step 3: Sort by timestamp so latest is first
      {
        $sort: {
          timeStamp: -1
        }
      },
      // Step 4: Group by contactId, keep latest message
      {
        $group: {
          _id: "$contactId",
          lastMessage: { $first: "$content" },
          timeStamp: { $first: "$timeStamp" }
        }
      },
      // Step 5: Convert contactId to ObjectId for lookup
      {
        $addFields: {
          userObjectId: {
            $convert: {
              input: "$_id",
              to: "objectId",
              onError: null,
              onNull: null
            }
          }
        }
      },
      // Step 6: Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // Step 7: Format output
      {
        $project: {
          userId: "$user._id",
          firstName: "$user.firstName",
          avatar: "$user.avatar",
          lastMessage: 1,
          timeStamp: 1
        }
      },
      // Optional: Sort by most recent chats
      {
        $sort: {
          timeStamp: -1
        }
      }
    ]);

    res.json(contacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
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
