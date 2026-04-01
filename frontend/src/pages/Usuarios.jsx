import { useState, useEffect } from "react";
import api from "../api/axios";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [error, setError] = useState("");

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch {
      setError("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    fetchUsuarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!nombre || !email || !password) return setError("Todos los campos son obligatorios");
    try {
      await api.post("/usuarios", { nombre, email, password, rol });
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("vendedor");
      setError("");
      fetchUsuarios();
    } catch {
      setError("Error al crear usuario");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    } catch {
      setError("Error al eliminar usuario");
    }
  };

  return (
    <div>
      <h2 style={titleStyle}>Usuarios</h2>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={formStyle}>
        <input
          style={inputStyle}
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          style={selectStyle}
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="vendedor">Vendedor</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleSubmit} style={btnStyle}>Crear usuario</button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Rol</th>
            <th style={thStyle}>Creado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.nombre}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <span style={u.rol === "admin" ? adminBadge : vendedorBadge}>
                  {u.rol}
                </span>
              </td>
              <td style={tdStyle}>{new Date(u.creado_at).toLocaleDateString("es-AR")}</td>
              <td style={tdStyle}>
                <button onClick={() => handleDelete(u.id)} style={deleteBtn}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const titleStyle = { fontSize: "20px", fontWeight: "500", marginBottom: "1.5rem" };
const errorStyle = { color: "#c0392b", fontSize: "13px", marginBottom: "1rem" };
const formStyle = { display: "flex", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" };
const inputStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", minWidth: "180px" };
const selectStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px" };
const btnStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "#1e1e2e", color: "#fff", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };
const deleteBtn = { padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ffb3b3", borderRadius: "6px", cursor: "pointer", background: "transparent", color: "#c0392b" };
const adminBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#e8f0fe", color: "#1a56a0", fontWeight: "500" };
const vendedorBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#e6faf0", color: "#0f6e56", fontWeight: "500" };

export default Usuarios;