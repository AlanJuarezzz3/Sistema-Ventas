import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarClientesPDF, exportarClientesExcel } from "../api/exportUtils";
import { s } from "../styles";
import ConfirmModal from "../components/ConfirmModal";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const admin = isAdmin();
  const navigate = useNavigate();

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
      setNombre(""); setEmail(""); setTelefono("");
      setEditId(null); setError(""); setShowForm(false);
      fetchClientes();
    } catch {
      setError("Error al guardar cliente");
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id); setNombre(c.nombre);
    setEmail(c.email || ""); setTelefono(c.telefono || "");
    setShowForm(true);
  };

  const handleDelete = (id, nombre) => {
    setConfirm({
      titulo: "Eliminar cliente",
      mensaje: `¿Estás seguro que querés eliminar a "${nombre}"? Se perderán todos sus datos.`,
      accion: async () => {
        try {
          await api.delete(`/clientes/${id}`);
          fetchClientes();
        } catch {
          setError("Error al eliminar cliente");
        }
      }
    });
  };

  const handleCancelar = () => {
    setEditId(null); setNombre(""); setEmail(""); setTelefono("");
    setError(""); setShowForm(false);
  };

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(texto) ||
      (c.email && c.email.toLowerCase().includes(texto)) ||
      (c.telefono && c.telefono.includes(texto))
    );
  });

  return (
    <div style={{ padding: "2rem" }}>
      {confirm && (
        <ConfirmModal
          titulo={confirm.titulo}
          mensaje={confirm.mensaje}
          onConfirmar={() => { confirm.accion(); setConfirm(null); }}
          onCancelar={() => setConfirm(null)}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ ...s.title, fontSize: "24px" }}>Clientes</h2>
          <p style={{ ...s.subtitle, fontSize: "14px" }}>{clientes.length} clientes en total</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>
            + Agregar cliente
          </button>
        )}
      </div>

      {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <div style={{ ...s.card, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1rem" }}>
            {editId ? "Editar cliente" : "Nuevo cliente"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <label style={s.label}>Nombre</label>
              <input style={s.input} placeholder="Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} placeholder="juan@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} placeholder="1134567890" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSubmit} style={s.btnPrimary}>{editId ? "Actualizar" : "Guardar"}</button>
            <button onClick={handleCancelar} style={s.btnSecondary}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ ...s.input, width: "280px" }}
          placeholder="Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <span style={{ ...s.muted, fontSize: "14px", color: "var(--text-secondary)" }}>
          {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? "s" : ""}
        </span>
        {admin && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button onClick={() => exportarClientesPDF(clientesFiltrados)} style={s.btnPrimary}>Exportar PDF</button>
            <button onClick={() => exportarClientesExcel(clientesFiltrados)} style={s.btnPrimary}>Exportar Excel</button>
          </div>
        )}
      </div>

      <div style={{ ...s.card, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Teléfono</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...s.td, textAlign: "center", color: "var(--text-muted)" }}>
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr key={c.id}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={s.tdMuted}>{c.id}</td>
                  <td style={{ ...s.td, fontWeight: "500" }}>{c.nombre}</td>
                  <td style={s.td}>{c.email || "—"}</td>
                  <td style={s.td}>{c.telefono || "—"}</td>
                  <td style={s.td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => navigate({ to: `/clientes/${c.id}/historial` })}
                        style={{ ...s.btnSmall, color: "var(--accent-text)", borderColor: "var(--accent-light)" }}
                      >
                        Historial
                      </button>
                      {admin && (
                        <>
                          <button onClick={() => handleEdit(c)} style={s.btnSmall}>Editar</button>
                          <button onClick={() => handleDelete(c.id, c.nombre)} style={s.btnDanger}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes;