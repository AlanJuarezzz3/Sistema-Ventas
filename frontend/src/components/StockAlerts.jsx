import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";

function StockAlerts() {
  const [sinStock, setSinStock] = useState([]);
  const [pocoStock, setPocoStock] = useState([]);
  const [cerrado, setCerrado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await api.get("/productos");
        setSinStock(res.data.filter((p) => p.stock === 0));
        setPocoStock(res.data.filter((p) => p.stock > 0 && p.stock <= 5));
      } catch {
        // silencioso
      }
    };
    fetchStock();
    const interval = setInterval(fetchStock, 60000);
    return () => clearInterval(interval);
  }, []);

  if (cerrado || (sinStock.length === 0 && pocoStock.length === 0)) return null;

  return (
    <div style={{
      backgroundColor: sinStock.length > 0 ? "var(--danger-light)" : "var(--warning-light)",
      borderBottom: `1px solid ${sinStock.length > 0 ? "var(--danger-border)" : "var(--warning)"}`,
      padding: "10px 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {sinStock.length > 0 && (
          <span style={{ fontSize: "13px", color: "var(--danger)", fontWeight: "500" }}>
            🔴 Sin stock: {sinStock.map((p) => p.nombre).join(", ")}
          </span>
        )}
        {pocoStock.length > 0 && (
          <span style={{ fontSize: "13px", color: "var(--warning)", fontWeight: "500" }}>
            🟡 Poco stock: {pocoStock.map((p) => `${p.nombre} (${p.stock})`).join(", ")}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={() => navigate({ to: "/productos" })}
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "6px",
            border: `1px solid ${sinStock.length > 0 ? "var(--danger-border)" : "var(--warning)"}`,
            backgroundColor: "transparent",
            color: sinStock.length > 0 ? "var(--danger)" : "var(--warning)",
            cursor: "pointer",
          }}
        >
          Ver productos
        </button>
        <button
          onClick={() => setCerrado(true)}
          style={{
            fontSize: "13px",
            padding: "2px 8px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            color: sinStock.length > 0 ? "var(--danger)" : "var(--warning)",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default StockAlerts;