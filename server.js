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

// Render ve Yerel Port Ayarı
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// BURAYA KENDİ TIKTOK KULLANICI ADINI YAZ
let tiktokUsername = "KENDI_KULLANICI_ADIN"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);

let countryScores = {};

tiktokConn.connect().then(state => {
    console.log(`✅ TikTok'a Bağlanıldı: ${state.roomId}`);
}).catch(err => {
    console.error('❌ Bağlantı Hatası:', err);
});

tiktokConn.on('chat', data => {
    const msg = data.comment.toUpperCase().trim();
    // Desteklenen kodlar
    const codes = ['TR', 'AZ', 'KU', 'SY', 'IQ', 'IR', 'US', 'DE', 'FR'];
    
    if (codes.includes(msg)) {
        if (!countryScores[msg]) countryScores[msg] = 0;
        countryScores[msg] += 1; // Mesaj başına 1 puan

        io.emit('score_update', {
            country: msg,
            totalScore: countryScores[msg],
            user: data.uniqueId,
            profilePic: data.profilePictureUrl
        });
    }
});

tiktokConn.on('gift', data => {
    // Hediye geldiğinde puanı daha çok artır (örnek: 10 katı)
    // Hangi ülkeye gideceğini bulmak için kullanıcının son mesajına bakılabilir 
    // veya basitçe mevcut lideri koruyabilirsin.
});

server.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});
