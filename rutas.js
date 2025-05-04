
const express = require('express');
const router = express.Router();
const db = require('./db');

// Función utilitaria
const query = (sql, params, res) => {
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

// Validacion mejora para la funcion utilitaria - proxima integracion.
/*
const query = (sql, params, res) => {
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage || 'Error de base de datos' });

    const esUpdateOrDelete = sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE');
    
    if (esUpdateOrDelete && result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró el registro para actualizar o eliminar' });
    }

    res.json(result);
  });
};
*/

// === LOGIN (AUTENTICACIÓN + DATOS DE USUARIO + REPORTES ASOCIADOS) ===
router.post('/login', (req, res) => {
  const { rut, clave } = req.body;
  const sql = `
    SELECT u.*, tu.descripcion_usuario
    FROM Usuario u
    JOIN TipoUsuario tu ON u.id_tipo_usuario = tu.id_tipo_usuario
    WHERE u.rut = ? AND u.clave = ?
  `;
  db.query(sql, [rut, clave], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = results[0];

    const sqlReportes = `
      SELECT r.*, 
             c.nombre_cliente, 
             ts.descripcion AS tipo_servicio, 
             th.descripcion AS tipo_hardware,
             so.nombre_sistema,
             es.descripcion AS estado_servicio
      FROM Reporte r
      JOIN Cliente c ON r.id_cliente = c.id_cliente
      JOIN TipoServicio ts ON r.id_tipo_servicio = ts.id_tipo_servicio
      JOIN TipoHardware th ON r.id_tipo_hardware = th.id_tipo_hardware
      JOIN SistemaOperativo so ON r.id_sistema_operativo = so.id_sistema_operativo
      JOIN EstadoServicio es ON r.id_estado_servicio = es.id_estado_servicio
      WHERE r.rut_usuario = ?
    `;

    db.query(sqlReportes, [rut], (err2, reportes) => {
      if (err2) return res.status(500).json({ error: err2 });

      res.json({ usuario, reportes });
    });
  });
});

// === USUARIOS ===
router.get('/usuarios', (req, res) => {
  query('SELECT * FROM Usuario', [], res);
});

router.get('/usuarios/:rut', (req, res) => {
  query('SELECT * FROM Usuario WHERE rut = ?', [req.params.rut], res);
});

router.post('/usuarios', (req, res) => {
  const { rut, nombre, email, edad, clave, id_tipo_usuario } = req.body;
  query('INSERT INTO Usuario (rut, nombre, email, edad, clave, id_tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)', 
    [rut, nombre, email, edad, clave, id_tipo_usuario], res);
});

router.put('/usuarios/:rut', (req, res) => {
  const { nombre, email, edad, clave, id_tipo_usuario } = req.body;
  query('UPDATE Usuario SET nombre = ?, email = ?, edad = ?, clave = ?, id_tipo_usuario = ? WHERE rut = ?', 
    [nombre, email, edad, clave, id_tipo_usuario, req.params.rut], res);
});

router.delete('/usuarios/:rut', (req, res) => {
  query('DELETE FROM Usuario WHERE rut = ?', [req.params.rut], res);
});

// === CLIENTES ===
router.get('/clientes', (req, res) => {
  query('SELECT * FROM Cliente', [], res);
});

router.get('/clientes/:id', (req, res) => {
  query('SELECT * FROM Cliente WHERE id_cliente = ?', [req.params.id], res);
});

router.post('/clientes', (req, res) => {
  const { nombre_cliente } = req.body;
  query('INSERT INTO Cliente (nombre_cliente) VALUES (?)', [nombre_cliente], res);
});

router.put('/clientes/:id', (req, res) => {
  const { nombre_cliente } = req.body;
  query('UPDATE Cliente SET nombre_cliente = ? WHERE id_cliente = ?', [nombre_cliente, req.params.id], res);
});

router.delete('/clientes/:id', (req, res) => {
  query('DELETE FROM Cliente WHERE id_cliente = ?', [req.params.id], res);
});

// === ESTADO SERVICIO ===
router.get('/estados-servicio', (req, res) => {
  query('SELECT * FROM EstadoServicio', [], res);
});

router.get('/estados-servicio/:id', (req, res) => {
  query('SELECT * FROM EstadoServicio WHERE id_estado_servicio = ?', [req.params.id], res);
});

router.post('/estados-servicio', (req, res) => {
  const { descripcion } = req.body;
  query('INSERT INTO EstadoServicio (descripcion) VALUES (?)', [descripcion], res);
});

router.put('/estados-servicio/:id', (req, res) => {
  const { descripcion } = req.body;
  query('UPDATE EstadoServicio SET descripcion = ? WHERE id_estado_servicio = ?', [descripcion, req.params.id], res);
});

router.delete('/estados-servicio/:id', (req, res) => {
  query('DELETE FROM EstadoServicio WHERE id_estado_servicio = ?', [req.params.id], res);
});

// === TIPO USUARIO ===
router.get('/tipos-usuario', (req, res) => {
  query('SELECT * FROM TipoUsuario', [], res);
});

router.get('/tipos-usuario/:id', (req, res) => {
  query('SELECT * FROM TipoUsuario WHERE id_tipo_usuario = ?', [req.params.id], res);
});

router.post('/tipos-usuario', (req, res) => {
  const { descripcion_usuario } = req.body;
  query('INSERT INTO TipoUsuario (descripcion_usuario) VALUES (?)', [descripcion_usuario], res);
});

router.put('/tipos-usuario/:id', (req, res) => {
  const { descripcion_usuario } = req.body;
  query('UPDATE TipoUsuario SET descripcion_usuario = ? WHERE id_tipo_usuario = ?', [descripcion_usuario, req.params.id], res);
});

router.delete('/tipos-usuario/:id', (req, res) => {
  query('DELETE FROM TipoUsuario WHERE id_tipo_usuario = ?', [req.params.id], res);
});

// === TIPO HARDWARE ===
router.get('/tipos-hardware', (req, res) => {
  query('SELECT * FROM TipoHardware', [], res);
});

router.get('/tipos-hardware/:id', (req, res) => {
  query('SELECT * FROM TipoHardware WHERE id_tipo_hardware = ?', [req.params.id], res);
});

router.post('/tipos-hardware', (req, res) => {
  const { descripcion } = req.body;
  query('INSERT INTO TipoHardware (descripcion) VALUES (?)', [descripcion], res);
});

router.put('/tipos-hardware/:id', (req, res) => {
  const { descripcion } = req.body;
  query('UPDATE TipoHardware SET descripcion = ? WHERE id_tipo_hardware = ?', [descripcion, req.params.id], res);
});

router.delete('/tipos-hardware/:id', (req, res) => {
  query('DELETE FROM TipoHardware WHERE id_tipo_hardware = ?', [req.params.id], res);
});

// === TIPO SERVICIO ===
router.get('/tipos-servicio', (req, res) => {
  query('SELECT * FROM TipoServicio', [], res);
});

router.get('/tipos-servicio/:id', (req, res) => {
  query('SELECT * FROM TipoServicio WHERE id_tipo_servicio = ?', [req.params.id], res);
});

router.post('/tipos-servicio', (req, res) => {
  const { descripcion } = req.body;
  query('INSERT INTO TipoServicio (descripcion) VALUES (?)', [descripcion], res);
});

router.put('/tipos-servicio/:id', (req, res) => {
  const { descripcion } = req.body;
  query('UPDATE TipoServicio SET descripcion = ? WHERE id_tipo_servicio = ?', [descripcion, req.params.id], res);
});

router.delete('/tipos-servicio/:id', (req, res) => {
  query('DELETE FROM TipoServicio WHERE id_tipo_servicio = ?', [req.params.id], res);
});

// === SISTEMA OPERATIVO ===
router.get('/sistemas-operativo', (req, res) => {
  query('SELECT * FROM SistemaOperativo', [], res);
});

router.get('/sistemas-operativo/:id', (req, res) => {
  query('SELECT * FROM SistemaOperativo WHERE id_sistema_operativo = ?', [req.params.id], res);
});

router.post('/sistemas-operativo', (req, res) => {
  const { nombre_sistema } = req.body;
  query('INSERT INTO SistemaOperativo (nombre_sistema) VALUES (?)', [nombre_sistema], res);
});

router.put('/sistemas-operativo/:id', (req, res) => {
  const { nombre_sistema } = req.body;
  query('UPDATE SistemaOperativo SET nombre_sistema = ? WHERE id_sistema_operativo = ?', [nombre_sistema, req.params.id], res);
});

router.delete('/sistemas-operativo/:id', (req, res) => {
  query('DELETE FROM SistemaOperativo WHERE id_sistema_operativo = ?', [req.params.id], res);
});

// === REPORTES ===
router.get('/reportes', (req, res) => {
  query('SELECT * FROM Reporte', [], res);
});

router.get('/reportes/:id', (req, res) => {
  query('SELECT * FROM Reporte WHERE id_reporte = ?', [req.params.id], res);
});

router.post('/reportes', (req, res) => {
  const {
    fecha_reporte,
    comentario, hora_inicio, hora_fin, direccion,
    rut_usuario, id_cliente, id_tipo_servicio, id_tipo_hardware,
    id_sistema_operativo, id_estado_servicio
  } = req.body;

  query(`INSERT INTO Reporte 
    (fecha_reporte, comentario, hora_inicio, hora_fin, direccion, rut_usuario, id_cliente, id_tipo_servicio, id_tipo_hardware, id_sistema_operativo, id_estado_servicio) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fecha_reporte, comentario, hora_inicio, hora_fin, direccion, rut_usuario, id_cliente, id_tipo_servicio, id_tipo_hardware, id_sistema_operativo, id_estado_servicio], res);
});

router.put('/reportes/:id', (req, res) => {
  const {
    fecha_reporte,
    comentario, hora_inicio, hora_fin, direccion,
    rut_usuario, id_cliente, id_tipo_servicio, id_tipo_hardware,
    id_sistema_operativo, id_estado_servicio
  } = req.body;

  query(`UPDATE Reporte SET 
    fecha_reporte = ?, comentario = ?, hora_inicio = ?, hora_fin = ?, direccion = ?, 
    rut_usuario = ?, id_cliente = ?, id_tipo_servicio = ?, id_tipo_hardware = ?, 
    id_sistema_operativo = ?, id_estado_servicio = ? 
    WHERE id_reporte = ?`,
    [fecha_reporte, comentario, hora_inicio, hora_fin, direccion, rut_usuario, id_cliente, id_tipo_servicio, id_tipo_hardware, id_sistema_operativo, id_estado_servicio, req.params.id], res);
});

router.delete('/reportes/:id', (req, res) => {
  query('DELETE FROM Reporte WHERE id_reporte = ?', [req.params.id], res);
});

module.exports = router;
