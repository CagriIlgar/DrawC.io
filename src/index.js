const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    // Drawing events to all clients
    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log("User disconnected", socket.id);
    });
});

app.use(express.static('public'));

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});