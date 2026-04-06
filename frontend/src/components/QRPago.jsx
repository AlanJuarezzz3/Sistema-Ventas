import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import { s } from "../styles";

function QRPago({ ventaId, total, clienteNombre, onCerrar }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generarQR = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/pagos/pagar/${ventaId}`);
      setUrl(res.data.qr_data);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al generar el QR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        ...s.card,
        padding: "2rem",
        width: "100%",
        maxWidth: "380px",
        margin: "1rem",
        textAlign: "center",
      }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
          Pago con QR
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "1.5rem" }}>
          Venta #{ventaId} — {clienteNombre}
        </p>

        {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

        {!url ? (
          <div>
            <div style={{
              backgroundColor: "var(--bg-input)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "8px" }}>Total a pagar</p>
              <p style={{ color: "var(--success)", fontSize: "28px", fontWeight: "600" }}>
                ${parseFloat(total).toLocaleString("es-AR")}
              </p>
            </div>
            <button
              onClick={generarQR}
              disabled={loading}
              style={{ ...s.btnPrimary, width: "100%", marginBottom: "8px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Generando QR..." : "Generar QR de pago"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "inline-block",
              marginBottom: "1rem",
            }}>
              <QRCodeSVG value={url} size={200} />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "1.5rem" }}>
              Escaneá el QR con la app de Mercado Pago para pagar
            </p>
            <p style={{ color: "var(--success)", fontSize: "20px", fontWeight: "600", marginBottom: "1.5rem" }}>
              ${parseFloat(total).toLocaleString("es-AR")}
            </p>
          </div>
        )}

        <button onClick={onCerrar} style={{ ...s.btnSecondary, width: "100%" }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default QRPago;