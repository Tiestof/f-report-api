
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
    WHERE 
      MONTH(r.fecha_reporte) = MONTH(CURDATE()) 
      AND YEAR(r.fecha_reporte) = YEAR(CURDATE())
    GROUP BY u.nombre, fecha
    ORDER BY u.nombre, fecha;
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

// === 5. Actividades de técnicos para hoy (incluye disponibles) ===
router.get('/estadisticas/actividades-hoy', async (req, res) => {
  const sqlConTareas = `
    SELECT 
      u.nombre AS nombre_tecnico,
      c.nombre_cliente AS nombre_cliente,
      TIME_FORMAT(r.hora_inicio, '%H:%i') AS hora_inicio,
      es.descripcion AS estado
    FROM Reporte r
    JOIN Usuario u ON r.rut_usuario = u.rut
    JOIN EstadoServicio es ON r.id_estado_servicio = es.id_estado_servicio
    JOIN Cliente c ON r.id_cliente = c.id_cliente
    WHERE DATE(r.fecha_reporte) = CURDATE()
      AND u.id_tipo_usuario != 2
  `;

  const sqlUsuarios = `
    SELECT nombre FROM Usuario WHERE id_tipo_usuario != 2
  `;

  try {
    const [conTareas, usuarios] = await Promise.all([
      new Promise((resolve, reject) => db.query(sqlConTareas, (err, rows) => err ? reject(err) : resolve(rows))),
      new Promise((resolve, reject) => db.query(sqlUsuarios, (err, rows) => err ? reject(err) : resolve(rows))),
    ]);

    const usuariosConTareas = new Set(conTareas.map(t => t.nombre_tecnico));
    const disponibles = usuarios
      .filter(t => !usuariosConTareas.has(t.nombre))
      .map(t => ({ nombre_tecnico: t.nombre, estado: 'Disponible' }));

    const resultado = [...conTareas, ...disponibles].sort((a, b) => {
      const ha = a.hora_inicio || '99:99';
      const hb = b.hora_inicio || '99:99';
      return ha.localeCompare(hb);
    });

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener actividades del día' });
  }
});

module.exports = router;