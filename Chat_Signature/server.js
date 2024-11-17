const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server);

const users = new Map();

const crypto = require("crypto");

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  socket.emit("init", Array.from(users.entries()));

  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;

    users.set(username, publicKey);
    console.log(`${username} registered with public key.`);

    io.emit("newUser", { username, publicKey });
  });

  socket.on("message", (data) => {
    const { username, message, signature } = data;

    let isFake = false;

    const publicKey = users.get(username);
    if (!publicKey) {
      console.log(`Fake user detected: ${username} (no public key found)`);
      isFake = true;
    } else {
      const isVerified = crypto.verify(
        "sha256",
        Buffer.from(message),
        publicKey,
        Buffer.from(signature, "hex")
      );

      if (!isVerified) {
        console.log(`Fake user detected: ${username} (invalid signature)`);
        isFake = true;
      }
    }

    io.emit("message", { username, message, isFake });
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});