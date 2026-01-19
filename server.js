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

// RENDER İÇİN KRİTİK PORT AYARI
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// KULLANICI ADINI BURAYA YAZ (YAYININ AÇIK OLMASI LAZIM)
let tiktokUsername = "KENDI_KULLANICI_ADIN"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);

let countryScores = {};

// Bağlantıyı bir fonksiyon içine alalım ki koparsa tekrar denesin
function connectTikTok() {
    tiktokConn.connect().then(state => {
        console.log(`✅ TikTok'a Bağlanıldı: ${state.roomId}`);
    }).catch(err => {
        console.error('❌ Bağlantı Hatası (Yayın kapalı olabilir):', err.message);
        // Yayın kapalıysa 1 dakikada bir tekrar denesin
        setTimeout(connectTikTok, 60000);
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

// Render için 0.0.0.0 üzerinden dinlemek çok önemlidir
server.listen(PORT, '0.0.
