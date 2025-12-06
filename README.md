# 🔗 Socket Server

A high-performance real-time socket server that powers live communication across applications.  
Supports message synchronization, file chunk streaming, delivery receipts, online presence tracking, and typing indicators.

---

## 🚀 Features

| Capability | Description |
|----------|-------------|
| 📨 Message Sync | Ensures messages are delivered in real time across all user devices and sessions |
| 📁 File Chunk Streaming | Upload & download large files in chunks with resume support |
| ✔️ Delivery Receipts | Real-time message delivery & read acknowledgements |
| 🟢 Online Status | Tracks user availability (online/offline/last seen) |
| ⌨️ Typing Indicators | Shows when a user is typing in a chat or group |

---

## 🛠 Tech Stack
- **Socket.io / WebSocket**
- **Node.js**
- **Express**
- **Nodemon**

> ⚠️ This server works as a real-time communication layer only.  
> Database or storage choice for messages/files is left to client applications.

---

## 📦 Installation

```bash
git clone https://github.com/bhargav-developer/socket-server
cd socket-server
npm install
```

## ▶️ Start the server

```bash
npm run dev
```
