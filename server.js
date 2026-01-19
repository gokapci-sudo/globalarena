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

// BURAYI GÜNCELLE: @ işareti koyma
let tiktokUsername = "onurkapci0"; 

let tiktokConn = new WebcastPushConnection(tiktokUsername);
let countryScores = {};
let userSelectedCountry = {}; 

tiktokConn.connect().then(state => {
    console.log(`✅ TikTok'a Baglanildi: ${state.roomId}`);
}).catch(err => {
    console.error('❌ Baglanti Hatasi:', err.message);
});

tiktokConn.on('chat', data => {
    const msg = data.comment.toUpperCase().trim();
    const codes = ['TR', 'AZ', 'KU', 'SY', 'IQ', 'IR', 'US', 'DE', 'FR'];
    if (codes.includes(msg)) {
        userSelectedCountry[data.uniqueId] = msg;
        if (!countryScores[msg]) countryScores[msg] = 0;
        countryScores[msg] += 1;
        io.emit('score_update', { country: msg, totalScore: countryScores[msg], type: 'chat' });
    }
});

tiktokConn.on('gift', data => {
    const userId = data.uniqueId;
    const selectedCountry = userSelectedCountry[userId];
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
    console.log(`🚀 Server ${PORT} aktif!`);
});




