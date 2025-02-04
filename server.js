require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.static("public"));

let users = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  users.push(socket.id);

  if (users.length === 2) {
    io.to(users[0]).emit("userConnected", users[1]);
    io.to(users[1]).emit("userConnected", users[0]);
  }

  socket.on("sendOffer", ({ target, signalData }) => {
    io.to(target).emit("offerReceived", {
      from: socket.id,
      signal: signalData,
    });
  });

  socket.on("sendAnswer", ({ target, signalData }) => {
    io.to(target).emit("answerReceived", signalData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter((user) => user !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
