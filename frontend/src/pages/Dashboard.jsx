import { useState, useEffect } from "react";
import api from "../api/axios";
import { s } from "../styles";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart
} from "recharts";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState("mes");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get(`/dashboard?periodo=${periodo}`);
        setData(res.data);
      } catch {
        setError("Error al cargar el dashboard");
      }
    };
    fetchDashboard();
  }, [periodo]);

  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={s.error}>{error}</div>
    </div>
  );

  if (!data) return (
    <div style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "14px" }}>
      Cargando dashboard...
    </div>
  );

  const tooltipStyle = {
    backgroundColor: "#1e1e27",
    border: "1px solid #2a2a35",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#f1f0ff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  };

  const metrics = [
    { label: "Total ventas activas", value: data.totalVentas.total, color: "var(--accent)" },
    { label: "Ingresos totales", value: `$${parseFloat(data.ingresoTotal.total).toLocaleString("es-AR")}`, color: "var(--success)" },
    { label: "Clientes", value: data.totalClientes.total, color: "var(--accent)" },
    { label: "Productos", value: data.totalProductos.total, color: "var(--accent)" },
    { label: "Sin stock", value: data.productosSinStock.total, color: data.productosSinStock.total > 0 ? "var(--danger)" : "var(--success)", alert: data.productosSinStock.total > 0 },
  ];

  const periodoLabel = {
    dia: "hoy",
    semana: "últimos 7 días",
    mes: "últimos 30 días",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ ...s.title, fontSize: "24px" }}>Dashboard</h2>
          <p style={{ ...s.subtitle, fontSize: "14px" }}>Resumen general del sistema</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["dia", "semana", "mes"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              style={{
                padding: "6px 16px",
                fontSize: "13px",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid var(--border)",
                backgroundColor: periodo === p ? "var(--accent)" : "transparent",
                color: periodo === p ? "#fff" : "var(--text-secondary)",
                fontWeight: periodo === p ? "500" : "400",
                transition: "all 0.15s",
              }}
            >
              {p === "dia" ? "Hoy" : p === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            ...s.card,
            padding: "1.25rem",
            borderLeftWidth: "3px",
            borderLeftStyle: "solid",
            borderLeftColor: m.color,
            backgroundColor: m.alert ? "var(--danger-light)" : "var(--bg-card)",
          }}>
            <p style={{ fontSize: "12px", color: m.alert ? "var(--danger)" : "var(--text-muted)", marginBottom: "8px" }}>{m.label}</p>
            <p style={{ fontSize: "26px", fontWeight: "600", color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ ...s.card, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500" }}>
              Ingresos — {periodoLabel[periodo]}
            </p>
            <span style={s.badgeAccent}>{data.ventasPorPeriodo.length} días con ventas</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.ventasPorPeriodo}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                formatter={(value) => [`$${parseFloat(value).toLocaleString("es-AR")}`, "Ingresos"]}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorIngresos)" dot={{ r: 4, fill: "#8b5cf6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...s.card, padding: "1.25rem" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1.25rem" }}>
            Productos más vendidos
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.productosMasVendidos} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="nombre" fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                formatter={(value) => [value, "Unidades"]}
              />
              <Bar dataKey="total_vendido" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ ...s.card, padding: "1.25rem" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1.25rem" }}>
            Ingresos últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.ventasPorMes}>
              <defs>
                <linearGradient id="colorMes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                formatter={(value) => [`$${parseFloat(value).toLocaleString("es-AR")}`, "Ingresos"]}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} fill="url(#colorMes)" dot={{ r: 4, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...s.card, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500" }}>Últimas 5 ventas</p>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Cliente</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.ventasRecientes.map((v) => (
                <tr key={v.id}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={s.tdMuted}>{v.id}</td>
                  <td style={{ ...s.td, fontWeight: "500" }}>{v.cliente_nombre}</td>
                  <td style={{ ...s.td, color: "var(--success)" }}>${parseFloat(v.total).toLocaleString("es-AR")}</td>
                  <td style={s.td}>{new Date(v.fecha).toLocaleDateString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;