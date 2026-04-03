import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch {
        setError("Error al cargar el dashboard");
      }
    };
    fetchDashboard();
  }, []);

  if (error) return <p style={errorStyle}>{error}</p>;
  if (!data) return <p style={{ padding: "2rem", color: "#555" }}>Cargando...</p>;

  return (
    <div>
      <h2 style={titleStyle}>Dashboard</h2>

      <div style={metricsGrid}>
        <div style={metricCard}>
          <p style={metricLabel}>Total ventas</p>
          <p style={metricValue}>{data.totalVentas.total}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Ingresos totales</p>
          <p style={metricValue}>${parseFloat(data.ingresoTotal.total).toLocaleString("es-AR")}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Clientes</p>
          <p style={metricValue}>{data.totalClientes.total}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Productos</p>
          <p style={metricValue}>{data.totalProductos.total}</p>
        </div>
        <div style={{ ...metricCard, borderColor: data.productosSinStock.total > 0 ? "#ffb3b3" : "#ddd" }}>
          <p style={metricLabel}>Sin stock</p>
          <p style={{ ...metricValue, color: data.productosSinStock.total > 0 ? "#c0392b" : "#222" }}>
            {data.productosSinStock.total}
          </p>
        </div>
      </div>

      <div style={chartsGrid}>
        <div style={chartCard}>
          <h3 style={chartTitle}>Ingresos últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.ventasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString("es-AR")}`} />
              <Line type="monotone" dataKey="ingresos" stroke="#1e1e2e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCard}>
          <h3 style={chartTitle}>Productos más vendidos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.productosMasVendidos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="nombre" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total_vendido" fill="#1e1e2e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={tableCard}>
        <h3 style={chartTitle}>Últimas 5 ventas</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.ventasRecientes.map((v) => (
              <tr key={v.id}>
                <td style={tdStyle}>{v.id}</td>
                <td style={tdStyle}>{v.cliente_nombre}</td>
                <td style={tdStyle}>${parseFloat(v.total).toLocaleString("es-AR")}</td>
                <td style={tdStyle}>{new Date(v.fecha).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const titleStyle = { fontSize: "20px", fontWeight: "500", marginBottom: "1.5rem" };
const errorStyle = { color: "#c0392b", fontSize: "13px" };
const metricsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "1.5rem" };
const metricCard = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", padding: "1rem 1.25rem" };
const metricLabel = { fontSize: "13px", color: "#555", marginBottom: "6px" };
const metricValue = { fontSize: "24px", fontWeight: "500" };
const chartsGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" };
const chartCard = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", padding: "1.25rem" };
const chartTitle = { fontSize: "15px", fontWeight: "500", marginBottom: "1rem" };
const tableCard = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", padding: "1.25rem" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };

export default Dashboard;