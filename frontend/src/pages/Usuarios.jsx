import { useState, useEffect } from "react";
import api from "../api/axios";
import { getUsuario } from "../api/auth";
import { s } from "../styles";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const usuarioActual = getUsuario();

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
      setNombre(""); setEmail(""); setPassword(""); setRol("vendedor");
      setError(""); setShowForm(false);
      fetchUsuarios();
    } catch {
      setError("Error al crear usuario");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al eliminar usuario");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ ...s.title, fontSize: "24px" }}>Usuarios</h2>
          <p style={{ ...s.subtitle, fontSize: "14px" }}>{usuarios.length} usuarios en total</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>
            + Agregar usuario
          </button>
        )}
      </div>

      {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <div style={{ ...s.card, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1rem" }}>
            Nuevo usuario
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <label style={s.label}>Nombre</label>
              <input style={s.input} placeholder="Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} placeholder="juan@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Password</label>
              <input type="password" style={s.input} placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Rol</label>
              <select style={{ ...s.select, width: "100%" }} value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSubmit} style={s.btnPrimary}>Guardar</button>
            <button onClick={() => { setShowForm(false); setError(""); }} style={s.btnSecondary}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ ...s.card, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Rol</th>
              <th style={s.th}>Creado</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}
                style={{ transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <td style={s.tdMuted}>{u.id}</td>
                <td style={s.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%",
                      backgroundColor: "var(--accent-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: "600", color: "var(--accent-text)",
                    }}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>{u.nombre}</span>
                    {usuarioActual?.id === u.id && (
                      <span style={{ ...s.badgeAccent, fontSize: "11px" }}>Vos</span>
                    )}
                  </div>
                </td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>
                  <span style={u.rol === "admin" ? s.badgeAccent : s.badgeSuccess}>
                    {u.rol}
                  </span>
                </td>
                <td style={s.td}>{new Date(u.creado_at).toLocaleDateString("es-AR")}</td>
                <td style={s.td}>
                  {usuarioActual?.id !== u.id && (
                    <button onClick={() => handleDelete(u.id)} style={s.btnDanger}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Usuarios;