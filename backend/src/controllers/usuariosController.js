// Importa la conexión a la base de datos
const db = require("../config/db");

// Importa bcrypt para encriptar contraseñas
const bcrypt = require("bcryptjs");

/**
 * Obtiene todos los usuarios de la base de datos
 * Devuelve id, nombre, email, rol y fecha de creación
 */
const getUsuarios = (req, res) => {
  // Ejecuta consulta SQL para traer todos los usuarios
  db.query(
    "SELECT id, nombre, email, rol, creado_at FROM usuarios",
    (err, result) => {
      // Si ocurre un error en la consulta
      if (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
      }

      // Devuelve los resultados en formato JSON
      res.json(result);
    }
  );
};

/**
 * Crea un nuevo usuario
 * Recibe nombre, email, password y rol desde el body
 */
const createUsuario = (req, res) => {
  // Desestructura los datos enviados en el body
  const { nombre, email, password, rol } = req.body;

  // Valida que los campos obligatorios estén presentes
  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

  // Verifica si el email ya existe en la base de datos
  db.query("SELECT id FROM usuarios WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    // Si el email ya está registrado, devuelve error
    if (result.length > 0) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    // Encripta la contraseña antes de guardarla (salt de 10 rondas)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Inserta el nuevo usuario en la base de datos
    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      // Si no se envía rol, se asigna "vendedor" por defecto
      [nombre, email, hashedPassword, rol || "vendedor"],
      (err, result) => {
        if (err) {
          console.error("Error al crear usuario:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }

        // Devuelve confirmación y el ID del usuario creado
        res.status(201).json({ mensaje: "Usuario creado", id: result.insertId });
      }
    );
  });
};

/**
 * Elimina un usuario por ID
 * El ID se obtiene desde los parámetros de la URL
 */
const deleteUsuario = (req, res) => {
  const { id } = req.params;

  // Evita que el usuario autenticado elimine su propia cuenta
  if (parseInt(id) === req.usuario.id) {
    return res.status(400).json({ mensaje: "No podés eliminar tu propia cuenta" });
  }

  // Ejecuta la eliminación en la base de datos
  db.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    // Si no se encontró el usuario
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Confirma eliminación
    res.json({ mensaje: "Usuario eliminado" });
  });
};

// Exporta las funciones para ser usadas en las rutas
module.exports = { getUsuarios, createUsuario, deleteUsuario };