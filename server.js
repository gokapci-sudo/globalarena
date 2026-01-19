const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// KENDİ KULLANICI ADINI BURAYA YAZ
let tiktokUsername = "onurkapci0"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);
let countryScores = {};
let lastMessageCountry = {}; // Kullanıcının seçtiği son ülkeyi tutar

tiktokConn.connect().then(state => {
    console.log(`✅ Bağlanıldı: ${state.roomId}`);
}).catch(err => {
    console.error('❌ Hata:', err);
});

// Chat'ten gelen mesajlar sadece PUAN artırır
tiktokConn.on('chat', data => {
    const msg = data.comment.toUpperCase().trim();
    const codes = ['TR', 'AZ', 'KU', 'SY', 'IQ', 'IR', 'US', 'DE', 'FR'];
    
    if (codes.includes(msg)) {
        lastMessageCountry[data.uniqueId] = msg; // Kullanıcıyı ülkesiyle eşleştir
        if (!countryScores[msg]) countryScores[msg] = 0;
        countryScores[msg] += 1;

        io.emit('score_update', {
            country: msg,
            totalScore: countryScores[msg],
            type: 'chat' // Sadece puan güncellemesi olduğunu belirt
        });
    }
});

// Sadece HEDİYE atanlar "KING" olur
tiktokConn.on('gift', data => {
    const user = data.uniqueId;
    const selectedCountry = lastMessageCountry[user]; // Hediye atanın son yazdığı ülke

    if (selectedCountry) {
        const giftPoints = data.diamondCount * 10; // Her elmas 10 puan
        countryScores[selectedCountry] += giftPoints;

        io.emit('score_update', {
            country: selectedCountry,
            totalScore: countryScores[selectedCountry],
            user: user,
            profilePic: data.profilePictureUrl,
            type: 'gift' // King değişikliği olduğunu belirt
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sunucu ${PORT} aktif!`);
});
