// socket.io.js
const socketIO = require('socket.io');

module.exports = {
  init: (server) => {
    const io = socketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    return io;
  }
};