const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

let rooms = {};

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    // Handle room creation›
    socket.on('create_room', (roomName) => {
        if (!rooms[roomName]) {
            rooms[roomName] = [];
            io.emit('room_list', Object.keys(rooms));
        }
    });

    // Send list of rooms to client
    socket.on('get_rooms', () => {
        socket.emit('room_list', Object.keys(rooms));
    });

    // Handle joining a room
    socket.on('join_room', ({ roomName, username }) => {
        socket.join(roomName);
        socket.username = username;
        socket.roomName = roomName;

        if (!rooms[roomName]) {
            rooms[roomName] = [];
        }
        rooms[roomName].push(username);

        io.to(roomName).emit('update_players', rooms[roomName]);
        io.to(roomName).emit('chat_message', `${username} joined the game`);
    });

    // Broadcast drawing events to all clients in the room
    socket.on('drawing', ({ roomName, fromX, fromY, toX, toY }) => {
        socket.to(roomName).emit('drawing', { fromX, fromY, toX, toY });
    });

    // Broadcast reset event to all clients in the room
    socket.on('reset', (roomName) => {
        io.to(roomName).emit('reset');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.roomName && socket.username) {
            const room = rooms[socket.roomName];
            if (room) {
                rooms[socket.roomName] = room.filter(player => player !== socket.username);
                if (rooms[socket.roomName].length === 0) {
                    delete rooms[socket.roomName];
                } else {
                    io.to(socket.roomName).emit('update_players', rooms[socket.roomName]);
                    io.to(socket.roomName).emit('chat_message', `${socket.username} left the game`);
                }
            }
        }
        console.log("User disconnected", socket.id);
    });
});

app.use(express.static('public'));

// Serve the drawing page for any room
app.get('/room/:room', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'drawing.html'));
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});