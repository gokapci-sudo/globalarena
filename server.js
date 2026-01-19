const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// TEST İÇİN ŞU AN YAYINDA OLAN BİRİNİ YAZ
const tiktokUsername = "mynameismeyra"; 

app.use(express.static(path.join(__dirname, 'public')));

let tiktokConn = new WebcastPushConnection(tiktokUsername);

// BAĞLANTI DURUMUNU İZLE
tiktokConn.connect().then(state => {
    console.log(`✅ BAĞLANTI KURULDU: ${tiktokUsername}`);
}).catch(err => {
    console.log(`❌ BAĞLANTI HATASI: ${err}`);
});

// CHAT'TEN GELEN HER ŞEYİ TERMİNALDE GÖR
tiktokConn.on('chat', data => {
    console.log(`💬 Mesaj Geldi: ${data.uniqueId} -> ${data.comment}`); // Bu satır PowerShell'de her şeyi gösterir
    
    const message = data.comment.toUpperCase().trim();
    if (message.length <= 3 || message === 'KU') {
        io.emit('score_update', {
            country: message,
            totalScore: 1, // Test için her seferinde 1 gönderelim
            user: data.nickname,
            profilePic: data.profilePictureUrl
        });
    }
});

server.listen(3000, () => {
    console.log('🚀 Sunucu http://localhost:3000 adresinde hazır!');
});