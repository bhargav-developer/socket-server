import e from "express";
import http from 'http'
import {Server} from 'socket.io'
const app = e();
const PORT = 4000;

const server = http.createServer(app);
const io = new Server(server);

server.listen(PORT,()=>{
  console.log("an socket server")
})