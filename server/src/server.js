const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");

const PORT = process.env.PORT || 5000;



async function startServer() {
  try {
    console.log(process.env.MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {

      console.log(
        "User connected:",
        socket.id
      );

      socket.on("join", (userId) => {

        socket.join(userId);

      });

      socket.on("disconnect", () => {

        console.log(
          "User disconnected:",
          socket.id
        );

      });

    });

    server.listen(PORT, () => {

      console.log(
        `Server running on port ${PORT}`
      );

    });

  }

  catch(error){

    console.error(
      "Server failed to start",
      error
    );

  }

}

startServer();