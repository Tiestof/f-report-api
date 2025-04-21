const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const rutas = require('./rutas'); // usa rutas.js 
const estadisticas = require('./rutas_estadisticas'); // usa rutas_estadisticas.js 


app.use(cors());
app.use(express.json());
app.use('/api', rutas); // prefijo de API
app.use('/api', estadisticas); // prefijo de API

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
