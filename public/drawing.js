// Initialize Socket.IO
const socket = io();

console.log("Rooms active");

const roomName = window.location.pathname.split('/').pop();
let username = localStorage.getItem('username');

if (!username) {
    username = prompt("Enter your username:");
    if (username) {
        localStorage.setItem('username', username);
    } else {
        window.location.href = '/';
    }
}

socket.emit('join_room', { roomName, username });

socket.on("connect", () => {
    console.log("connected");
});

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();

// Ensure canvas dimensions are correct on window resize
window.addEventListener('resize', resizeCanvas);

let drawing = false;
let lastX = 0;
let lastY = 0;

function drawLine(fromX, fromY, toX, toY) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
}

function interpolateAndDraw(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 2);
    const stepX = dx / steps;
    const stepY = dy / steps;

    let currentX = fromX;
    let currentY = fromY;

    for (let i = 0; i < steps; i++) {
        const nextX = currentX + stepX;
        const nextY = currentY + stepY;
        drawLine(currentX, currentY, nextX, nextY);
        currentX = nextX;
        currentY = nextY;
    }

    drawLine(currentX, currentY, toX, toY);
}

function draw(e) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    interpolateAndDraw(lastX, lastY, x, y);

    socket.emit('drawing', { roomName, fromX: lastX, fromY: lastY, toX: x, toY: y });

    lastX = x;
    lastY = y;
}

socket.on('drawing', ({ fromX, fromY, toX, toY }) => {
    interpolateAndDraw(fromX, fromY, toX, toY);
});

// Handle reset event from server
socket.on('reset', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Update player list
socket.on('update_players', (players) => {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player;
        playerList.appendChild(li);
    });
});

// Add chat message
socket.on('chat_message', (message) => {
    const chatMessages = document.getElementById('chatMessages');
    const li = document.createElement('li');
    li.textContent = message;
    chatMessages.appendChild(li);
});

// Reset functionality
document.getElementById('resetButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('reset', roomName);
});

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
});
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);
canvas.addEventListener('mousemove', draw);

// Clear username from localStorage on tab close
window.addEventListener('beforeunload', () => {
    localStorage.removeItem('username');
});