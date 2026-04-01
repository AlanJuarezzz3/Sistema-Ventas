const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getUsuarios = (req, res) => {
  db.query(
    "SELECT id, nombre, email, rol, creado_at FROM usuarios",
    (err, result) => {
      if (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }
      res.json(result);
    }
  );
};

const createUsuario = (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

  db.query("SELECT id FROM usuarios WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (result.length > 0) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, rol || "vendedor"],
      (err, result) => {
        if (err) {
          console.error("Error al crear usuario:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }
        res.status(201).json({ mensaje: "Usuario creado", id: result.insertId });
      }
    );
  });
};

const deleteUsuario = (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.usuario.id) {
    return res.status(400).json({ mensaje: "No podés eliminar tu propia cuenta" });
  }

  db.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado" });
  });
};

module.exports = { getUsuarios, createUsuario, deleteUsuario };