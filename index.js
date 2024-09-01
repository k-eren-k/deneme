const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('Yeni kullanıcı bağlandı');

    socket.on('createRoom', (callback) => {
        const roomCode = Math.random().toString(36).substr(2, 11).toUpperCase();
        rooms[roomCode] = { users: [socket.id] };
        socket.join(roomCode);
        callback(roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            rooms[roomCode].users.push(socket.id);
            io.to(roomCode).emit('message', 'Bir kullanıcı katıldı');
            setupPeerConnections(roomCode);
        }
    });

    function setupPeerConnections(roomCode) {
        const users = rooms[roomCode].users;
        users.forEach((userId) => {
            if (userId !== socket.id) {
                const peerSocket = io.sockets.sockets.get(userId);
                peerSocket.emit('signal', { offer: createOffer() });
            }
        });
    }

    function createOffer() {
        const peerConnection = new RTCPeerConnection(configuration);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', {
                    roomCode: document.getElementById('roomCode').value,
                    signalData: { candidate: event.candidate }
                });
            }
        };

        return peerConnection.createOffer().then(offer => {
            return peerConnection.setLocalDescription(offer).then(() => {
                return offer;
            });
        });
    }

    function createAnswer(peerConnection, offer) {
        return peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => answer);
    }

    socket.on('signal', (data) => {
        const { roomCode, signalData } = data;
        const peerConnection = new RTCPeerConnection(configuration);

        if (signalData.offer) {
            createAnswer(peerConnection, signalData.offer)
                .then(answer => {
                    socket.emit('signal', {
                        roomCode: roomCode,
                        signalData: { answer: answer }
                    });
                });
        } else if (signalData.answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.answer));
        } else if (signalData.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
    });

    socket.on('sendMessage', (roomCode, message) => {
        io.to(roomCode).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı');
        for (const roomCode in rooms) {
            rooms[roomCode].users = rooms[roomCode].users.filter(id => id !== socket.id);
            if (rooms[roomCode].users.length === 0) {
                delete rooms[roomCode];
            }
        }
        io.emit('message', 'Bir kullanıcı ayrıldı');
    });
});

server.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor');
});
