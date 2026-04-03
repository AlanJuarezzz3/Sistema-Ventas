export const s = {
  // Layout
  page: { backgroundColor: "var(--bg-base)", minHeight: "100vh" },
  card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" },
  
  // Textos
  title: { color: "var(--text-primary)", fontSize: "20px", fontWeight: "500" },
  subtitle: { color: "var(--text-secondary)", fontSize: "13px" },
  muted: { color: "var(--text-muted)", fontSize: "13px" },
  label: { color: "var(--accent-text)", fontSize: "12px", marginBottom: "6px", display: "block" },

  // Inputs
  input: {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  },
  select: {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    outline: "none",
  },

  // Botones
  btnPrimary: {
    backgroundColor: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "500",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
  },
  btnDanger: {
    backgroundColor: "transparent",
    color: "var(--danger)",
    border: "1px solid var(--danger-border)",
    borderRadius: "8px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },
  btnSmall: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },

  // Tabla
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--accent-text)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border)",
  },
  tdMuted: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)",
  },

  // Badges
  badgeSuccess: { backgroundColor: "var(--success-light)", color: "var(--success)", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500" },
  badgeWarning: { backgroundColor: "var(--warning-light)", color: "var(--warning)", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500" },
  badgeDanger: { backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500" },
  badgeMuted: { backgroundColor: "var(--bg-input)", color: "var(--text-muted)", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500" },
  badgeAccent: { backgroundColor: "var(--accent-light)", color: "var(--accent-text)", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500" },

  // Sección header
  sectionHeader: { color: "var(--accent-text)", fontSize: "13px", fontWeight: "500" },

  // Error
  error: { backgroundColor: "var(--danger-light)", border: "1px solid var(--danger-border)", color: "var(--danger)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" },
};