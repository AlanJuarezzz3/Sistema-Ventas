import { s } from "../styles";

function ConfirmModal({ titulo, mensaje, onConfirmar, onCancelar }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        ...s.card,
        padding: "1.5rem",
        width: "100%",
        maxWidth: "420px",
        margin: "1rem",
      }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>
          {titulo}
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "1.5rem", lineHeight: "1.5" }}>
          {mensaje}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onCancelar} style={s.btnSecondary}>
            Cancelar
          </button>
          <button onClick={onConfirmar} style={{
            ...s.btnPrimary,
            backgroundColor: "var(--danger)",
          }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;