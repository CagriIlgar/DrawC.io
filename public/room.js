const socket = io();

console.log("Rooms active");

document.getElementById('createRoomButton').addEventListener('click', () => {
    const roomName = document.getElementById('newRoomName').value;
    if (roomName) {
        socket.emit('create_room', roomName);
        document.getElementById('newRoomName').value = '';
    }
});

socket.on('room_list', (rooms) => {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = room;
        li.addEventListener('click', () => {
            const username = prompt('Enter your username:');
            if (username) {
                localStorage.setItem('username', username);
                window.location.href = `/room/${room}`;
            }
        });
        roomList.appendChild(li);
    });
});

socket.on('connect', () => {
    socket.emit('get_rooms');
});