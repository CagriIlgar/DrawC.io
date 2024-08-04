const socket = io();

socket.on("connect", () => {
    console.log("connected");
});

// Mouse movement
document.addEventListener('mousemove', (event) => {
    const mouseData = {
        x: event.clientX,
        y: event.clientY,
        timestamp: new Date().toISOString()
    };

    // Send mouse data to the server
    socket.emit('mouseMovement', mouseData);
});