import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const admin = isAdmin();

  const fetchClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch {
      setError("Error al cargar clientes");
    }
  };

  useEffect(() => {
    fetchClientes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!nombre) return setError("El nombre es obligatorio");
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, { nombre, email, telefono });
      } else {
        await api.post("/clientes", { nombre, email, telefono });
      }
      setNombre("");
      setEmail("");
      setTelefono("");
      setEditId(null);
      setError("");
      fetchClientes();
    } catch {
      setError("Error al guardar cliente");
    }
  };

  const handleEdit = (cliente) => {
    setEditId(cliente.id);
    setNombre(cliente.nombre);
    setEmail(cliente.email || "");
    setTelefono(cliente.telefono || "");
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    } catch {
      setError("Error al eliminar cliente");
    }
  };

  return (
    <div>
      <h2 style={titleStyle}>Clientes</h2>

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
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <button onClick={handleSubmit} style={btnStyle}>
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && (
          <button onClick={() => { setEditId(null); setNombre(""); setEmail(""); setTelefono(""); }} style={cancelStyle}>
            Cancelar
          </button>
        )}
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Teléfono</th>
            {admin && <th style={thStyle}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td style={tdStyle}>{c.id}</td>
              <td style={tdStyle}>{c.nombre}</td>
              <td style={tdStyle}>{c.email || "—"}</td>
              <td style={tdStyle}>{c.telefono || "—"}</td>
              {admin && (
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(c)} style={editBtn}>Editar</button>
                  <button onClick={() => handleDelete(c.id)} style={deleteBtn}>Eliminar</button>
                </td>
              )}
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
const btnStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "#1e1e2e", color: "#fff", cursor: "pointer" };
const cancelStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "transparent", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };
const editBtn = { marginRight: "8px", padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ccc", borderRadius: "6px", cursor: "pointer", background: "transparent" };
const deleteBtn = { padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ffb3b3", borderRadius: "6px", cursor: "pointer", background: "transparent", color: "#c0392b" };

export default Clientes;