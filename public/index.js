const socket = io();

socket.on("connect", () => {
    console.log("connected");
});

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 400;

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

    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;

    interpolateAndDraw(lastX, lastY, x, y);

    socket.emit('drawing', { fromX: lastX, fromY: lastY, toX: x, toY: y });

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

// Reset functionality
document.getElementById('resetButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('reset');
});

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    lastX = e.clientX - canvas.offsetLeft;
    lastY = e.clientY - canvas.offsetTop;
});
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);
canvas.addEventListener('mousemove', draw);