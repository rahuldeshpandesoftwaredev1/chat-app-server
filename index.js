const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3001;
const http = require('http');
const {Server} = require('socket.io');
const { Socket } = require('dgram');

const server = http.createServer(app);

const DATA_FILE = path.join(__dirname, 'data.json');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

app.get('/api/users', (req, res) => {
    console.log(DATA_FILE);
    fs.readFile(DATA_FILE, (err, data) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.json(JSON.parse(data));
    });
  });

const UI_ENDPOINT = 'http://localhost:3000';

const io = new Server(server, {
    cors: {
        origin: UI_ENDPOINT,
        methods: ['GET', 'POST']
    }
});

let count = 0;
io.on('connection', (socket) => {

    // Indicate establisehd connection.
    console.log(`User connected: ${socket.id}, total = ${count++}`);


    socket.on('join_room_finish', (data) => {
        console.log(`finishing joining for ${data.userId}`);
        socket.join(data.roomId);
    });

    // Join room
    socket.on('join_room_start', (data) => {
        console.log(`joining room of d = ${data.roomId} for client = ${socket.id}`);
        socket.join(data.roomId);
        console.log(`Call please_join_room_${data.targetUserId}`);
        socket.broadcast.emit(`please_join_room_${data.targetUserId}`, {roomId: data.roomId, sourceUser: data.sourceUser});
    })

    // Send message to someone else in that room.
    socket.on('send_message', (data) => {
        console.log(data);
        socket
            .to(data.roomId)
            .emit('receive_message', data);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

