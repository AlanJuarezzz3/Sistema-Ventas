const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "alan",
  password: "1234",
  database: "mi_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.log("Error de conexión:", err.message);
    return;
  }
  console.log("Conectado a MySQL");
  connection.release();
});

module.exports = pool;