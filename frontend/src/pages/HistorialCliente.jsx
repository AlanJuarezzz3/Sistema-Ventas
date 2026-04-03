import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import api from "../api/axios";
import { s } from "../styles";

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

  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={s.error}>{error}</div>
    </div>
  );

  if (!data) return (
    <div style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "14px" }}>
      Cargando historial...
    </div>
  );

  const ventasActivas = data.ventas.filter((v) => v.estado === "activa");
  const totalGastado = ventasActivas.reduce((acc, v) => acc + parseFloat(v.total), 0);

  const ventasFiltradas = data.ventas.filter((v) => {
    if (filtroEstado === "todas") return true;
    return v.estado === filtroEstado;
  });

  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={() => navigate({ to: "/clientes" })}
        style={{ ...s.btnSecondary, fontSize: "13px", padding: "6px 14px", marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        ← Volver a clientes
      </button>

      <div style={{ ...s.card, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "var(--accent-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: "600", color: "var(--accent-text)",
          }}>
            {data.cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ ...s.title, fontSize: "18px" }}>{data.cliente.nombre}</h2>
            <p style={s.subtitle}>Historial de compras</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: "Compras activas", value: ventasActivas.length },
            { label: "Total gastado", value: `$${totalGastado.toLocaleString("es-AR")}` },
            { label: "Total ventas", value: data.ventas.length },
          ].map((stat) => (
            <div key={stat.label} style={{
              ...s.card,
              padding: "0.75rem 1.25rem",
              textAlign: "center",
              backgroundColor: "var(--bg-input)",
            }}>
              <p style={{ ...s.muted, marginBottom: "4px" }}>{stat.label}</p>
              <p style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: "500" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "1rem", alignItems: "center" }}>
        <select style={s.select} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="activa">Activas</option>
          <option value="anulada">Anuladas</option>
        </select>
        <span style={{ ...s.muted, fontSize: "14px" }}>
          {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {ventasFiltradas.length === 0 ? (
        <div style={{ ...s.card, padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          No hay ventas para mostrar
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {ventasFiltradas.map((v) => (
            <div key={v.id} style={{ ...s.card, overflow: "hidden", opacity: v.estado === "anulada" ? 0.5 : 1 }}>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "1rem 1.25rem", cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                onClick={() => setVentaAbierta(ventaAbierta === v.id ? null : v.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <span style={s.muted}>#{v.id}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                    {new Date(v.fecha).toLocaleDateString("es-AR")}
                  </span>
                  <span style={v.estado === "activa" ? s.badgeSuccess : s.badgeMuted}>
                    {v.estado}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <span style={{
                    color: v.estado === "anulada" ? "var(--text-muted)" : "var(--text-primary)",
                    fontSize: "14px", fontWeight: "500",
                    textDecoration: v.estado === "anulada" ? "line-through" : "none",
                  }}>
                    ${parseFloat(v.total).toLocaleString("es-AR")}
                  </span>
                  <span style={s.muted}>{ventaAbierta === v.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {ventaAbierta === v.id && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Producto</th>
                        <th style={s.th}>Cantidad</th>
                        <th style={s.th}>Precio unitario</th>
                        <th style={s.th}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.detalle.map((d, index) => (
                        <tr key={index}>
                          <td style={{ ...s.td, fontWeight: "500" }}>{d.producto}</td>
                          <td style={s.td}>{d.cantidad}</td>
                          <td style={s.td}>${parseFloat(d.precio_unitario).toLocaleString("es-AR")}</td>
                          <td style={s.td}>${parseFloat(d.subtotal).toLocaleString("es-AR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistorialCliente;