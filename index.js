const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const rutas = require('./rutas');
const estadisticas = require('./rutas_estadisticas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', rutas);
app.use('/api', estadisticas);

// Leer certificados SSL de Let's Encrypt
const privateKey = fs.readFileSync('/etc/letsencrypt/live/f-report.xyz/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/f-report.xyz/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Servidor HTTPS en puerto 3000
const httpsServer = https.createServer(credentials, app);

const PORT = 3000;
httpsServer.listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en https://f-report.xyz:${PORT}`);
});
