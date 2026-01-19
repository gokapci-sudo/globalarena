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

// BURAYA @ OLMADAN KULLANICI ADINI YAZ
let tiktokUsername = "onurkapci0"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);
let countryScores = {};
let userSelectedCountry = {}; // Kullanıcının seçtiği ülkeyi hafızada tutar

tiktokConn.connect().then(state => {
    console.log(`✅ TikTok Bağlantısı Başarılı: ${state.roomId}`);
}).catch(err => {
    console.error('❌ Bağlantı Hatası:', err);
});

// CHAT İZLEME
tiktokConn.on('chat', data => {
    const msg = data.comment.toUpperCase().trim();
    const codes = ['TR', 'AZ', 'KU', 'SY', 'IQ', 'IR', 'US', 'DE', 'FR'];
    
    if (codes.includes(msg)) {
        // Kullanıcının en son hangi ülkeyi seçtiğini kaydet (Hediye için)
        userSelectedCountry[data.uniqueId] = msg;

        // Puanı artır
        if (!countryScores[msg]) countryScores[msg] = 0;
        countryScores[msg] += 1;

        // Ekrana gönder
        io.emit('score_update', {
            country: msg,
            totalScore: countryScores[msg],
            type: 'chat'
        });
    }
});

// HEDİYE İZLEME
tiktokConn.on('gift', data => {
    const userId = data.uniqueId;
    const selectedCountry = userSelectedCountry[userId];

    // Eğer kullanıcı daha önce bir ülke kodu yazdıysa hediyesi o ülkeye gider
    if (selectedCountry) {
        const points = data.diamondCount * 10;
        countryScores[selectedCountry] += points;

        io.emit('score_update', {
            country: selectedCountry,
            totalScore: countryScores[selectedCountry],
            user: data.uniqueId,
            profilePic: data.profilePictureUrl,
            type: 'gift'
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ${PORT} üzerinde çalışıyor...`);
});
