import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import api from "../api/axios";

function HistorialCliente() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ventaAbierta, setVentaAbierta] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await api.get(`/clientes/${id}/historial`);
        setData(res.data);
      } catch {
        setError("Error al cargar el historial");
      }
    };
    fetchHistorial();
  }, [id]);

  if (error) return <p style={errorStyle}>{error}</p>;
  if (!data) return <p style={{ color: "#555" }}>Cargando...</p>;

  const ventasActivas = data.ventas.filter((v) => v.estado === "activa");
  const totalGastado = ventasActivas.reduce((acc, v) => acc + parseFloat(v.total), 0);

  const ventasFiltradas = data.ventas.filter((v) => {
    if (filtroEstado === "todas") return true;
    return v.estado === filtroEstado;
  });

  return (
    <div>
      <button onClick={() => navigate({ to: "/clientes" })} style={backBtn}>
        ← Volver a clientes
      </button>

      <div style={headerCard}>
        <div>
          <h2 style={titleStyle}>{data.cliente.nombre}</h2>
          <p style={{ fontSize: "13px", color: "#555" }}>Historial de compras</p>
        </div>
        <div style={statsGrid}>
          <div style={statCard}>
            <p style={statLabel}>Compras activas</p>
            <p style={statValue}>{ventasActivas.length}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Total gastado</p>
            <p style={statValue}>${totalGastado.toLocaleString("es-AR")}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Total ventas</p>
            <p style={statValue}>{data.ventas.length}</p>
          </div>
        </div>
      </div>

      <div style={filtrosStyle}>
        <select
          style={selectStyle}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="activa">Activas</option>
          <option value="anulada">Anuladas</option>
        </select>
        <span style={resultadosStyle}>
          {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {ventasFiltradas.length === 0 ? (
        <div style={emptyStyle}>No hay ventas para mostrar</div>
      ) : (
        ventasFiltradas.map((v) => (
          <div key={v.id} style={{ ...ventaCard, opacity: v.estado === "anulada" ? 0.6 : 1 }}>
            <div
              style={ventaHeader}
              onClick={() => setVentaAbierta(ventaAbierta === v.id ? null : v.id)}
            >
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>#{v.id}</span>
                <span style={{ fontSize: "14px" }}>{new Date(v.fecha).toLocaleDateString("es-AR")}</span>
                <span style={v.estado === "activa" ? activaBadge : anuladaBadge}>
                  {v.estado}
                </span>
              </div>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <span style={{
                  ...totalBadge,
                  textDecoration: v.estado === "anulada" ? "line-through" : "none",
                  background: v.estado === "anulada" ? "#f0f0f0" : "#e6faf0",
                  color: v.estado === "anulada" ? "#888" : "#0f6e56",
                }}>
                  ${parseFloat(v.total).toLocaleString("es-AR")}
                </span>
                <span style={{ fontSize: "13px", color: "#888" }}>
                  {ventaAbierta === v.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {ventaAbierta === v.id && (
              <div style={ventaDetalle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Producto</th>
                      <th style={thStyle}>Cantidad</th>
                      <th style={thStyle}>Precio unitario</th>
                      <th style={thStyle}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.detalle.map((d, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>{d.producto}</td>
                        <td style={tdStyle}>{d.cantidad}</td>
                        <td style={tdStyle}>${parseFloat(d.precio_unitario).toLocaleString("es-AR")}</td>
                        <td style={tdStyle}>${parseFloat(d.subtotal).toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const titleStyle = { fontSize: "20px", fontWeight: "500" };
const errorStyle = { color: "#c0392b", fontSize: "13px" };
const backBtn = { marginBottom: "1.5rem", padding: "6px 14px", fontSize: "13px", border: "0.5px solid #ccc", borderRadius: "8px", cursor: "pointer", background: "transparent", display: "block" };
const headerCard = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" };
const statsGrid = { display: "flex", gap: "12px" };
const statCard = { background: "#f9f9f9", border: "0.5px solid #eee", borderRadius: "8px", padding: "0.75rem 1.25rem", textAlign: "center" };
const statLabel = { fontSize: "12px", color: "#888", marginBottom: "4px" };
const statValue = { fontSize: "20px", fontWeight: "500" };
const filtrosStyle = { display: "flex", gap: "12px", marginBottom: "1.5rem", alignItems: "center" };
const selectStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px" };
const resultadosStyle = { fontSize: "13px", color: "#888" };
const emptyStyle = { textAlign: "center", color: "#888", padding: "3rem", background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px" };
const ventaCard = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", marginBottom: "12px", overflow: "hidden" };
const ventaHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer" };
const ventaDetalle = { borderTop: "0.5px solid #eee", padding: "1rem 1.25rem" };
const totalBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "500" };
const activaBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#e6faf0", color: "#0f6e56", fontWeight: "500" };
const anuladaBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#f0f0f0", color: "#888", fontWeight: "500" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "8px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "8px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };

export default HistorialCliente;