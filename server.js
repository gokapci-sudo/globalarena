const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Render'ın atadığı portu veya 10000'i kullanır
const PORT = process.env.PORT || 10000;

// index.html artık dışarıda olduğu için direkt ana dizinden gönderiyoruz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// BURAYA TIKTOK KULLANICI ADINI YAZ (CANLI YAYINDA OLMALISIN)
let tiktokUsername = "onurkapci0"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);
let countryScores = {};

function connectTikTok() {
    tiktokConn.connect().then(state => {
        console.log(`✅ TikTok'a Bağlanıldı: ${state.roomId}`);
    }).catch(err => {
        console.error('❌ TikTok Bağlantı Hatası (Yayın kapalı olabilir):', err.message);
        setTimeout(connectTikTok, 15000); // 15 saniyede bir tekrar dene
    });
}

connectTikTok();

tiktokConn.on('chat', data => {
    const msg = data.comment.toUpperCase().trim();
    const codes = ['TR', 'AZ', 'KU', 'SY', 'IQ', 'IR', 'US', 'DE', 'FR'];
    
    if (codes.includes(msg)) {
        if (!countryScores[msg]) countryScores[msg] = 0;
        countryScores[msg] += 1;

        io.emit('score_update', {
            country: msg,
            totalScore: countryScores[msg],
            user: data.uniqueId,
            profilePic: data.profilePictureUrl
        });
    }
});

// 0.0.0.0 dinlemesi Render'ın dış erişimi için zorunludur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});


