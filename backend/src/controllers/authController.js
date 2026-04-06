/**
 * authController.js — Controlador de autenticación
 *
 * Maneja el registro y login de usuarios del sistema.
 * Usa bcryptjs para hashear contraseñas antes de guardarlas en la base de datos,
 * nunca se guarda la contraseña en texto plano.
 * Usa jsonwebtoken para generar tokens JWT que el frontend usa para autenticarse.
 */

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "clave_secreta_123";

/**
 * register — Crea un nuevo usuario en el sistema
 * Verifica que el email no esté registrado antes de insertar.
 * El password se hashea con bcrypt antes de guardarse.
 * POST /auth/register
 */
const register = (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    if (result.length > 0) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    // Hashea el password con un salt de 10 rondas
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, rol || "vendedor"],
      (err, result) => {
        if (err) {
          console.error("Error al crear usuario:", err);
          return res.status(500).json({ mensaje: "Error interno del servidor" });
        }
        res.status(201).json({ mensaje: "Usuario registrado correctamente" });
      }
    );
  });
};

/**
 * login — Autentica un usuario y devuelve un token JWT
 * Verifica el email, compara el password con bcrypt,
 * y si todo es correcto genera un token que expira en 8 horas.
 * El token contiene: id, email y rol del usuario.
 * POST /auth/login
 */
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: "Email y password son obligatorios" });
  }

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }

    if (result.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const usuario = result[0];

    // Compara el password ingresado con el hash guardado en la base de datos
    const passwordValida = bcrypt.compareSync(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    // Genera el token JWT con los datos del usuario
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  });
};

module.exports = { register, login };