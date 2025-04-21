
const express = require('express');
const router = express.Router();
const db = require('./db');

// Utilidad para consultas simples
const query = (sql, params, res) => {
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

// === 1. Total de servicios por tipo de estado ===
router.get('/estadisticas/servicios-por-estado', (req, res) => {
  const sql = `
    SELECT es.descripcion AS estado, COUNT(*) AS total
    FROM Reporte r
    JOIN EstadoServicio es ON r.id_estado_servicio = es.id_estado_servicio
    GROUP BY es.descripcion
  `;
  query(sql, [], res);
});

// === 2. Carga laboral por técnico por mes y día ===
router.get('/estadisticas/carga-tecnicos', (req, res) => {
  const sql = `
    SELECT 
      u.nombre,
      DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS fecha,
      COUNT(*) AS total_servicios
    FROM Reporte r
    JOIN Usuario u ON r.rut_usuario = u.rut
    GROUP BY u.nombre, fecha
    ORDER BY u.nombre, fecha
  `;
  query(sql, [], res);
});

// === 3. Reportes del día en curso con estado distinto a 'FINALIZADO' ===
router.get('/estadisticas/reportes-no-finalizados-hoy', (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM Reporte r
    JOIN EstadoServicio es ON r.id_estado_servicio = es.id_estado_servicio
    WHERE es.descripcion != 'FINALIZADO'
    AND DATE(r.fecha_reporte) = CURDATE()
  `;
  query(sql, [], res);
});

// === 4. Total de servicios del mes actual ===
router.get('/estadisticas/servicios-del-mes', (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM Reporte
    WHERE MONTH(fecha_reporte) = MONTH(CURRENT_DATE())
    AND YEAR(fecha_reporte) = YEAR(CURRENT_DATE())
  `;
  query(sql, [], res);
});

module.exports = router;