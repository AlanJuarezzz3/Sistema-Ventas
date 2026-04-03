import { useNavigate, useRouterState } from "@tanstack/react-router";
import { isAdmin } from "../api/auth";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const admin = isAdmin();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate({ to: "/" });
  };

  const navLinks = [
    ...(admin ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    { to: "/productos", label: "Productos" },
    { to: "/clientes", label: "Clientes" },
    { to: "/ventas", label: "Ventas" },
    ...(admin ? [{ to: "/usuarios", label: "Usuarios" }] : []),
  ];

  return (
    <nav style={{
      backgroundColor: "var(--nav-bg)",
      borderBottom: "1px solid var(--nav-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      height: "56px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px",
            backgroundColor: "var(--accent)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: "11px", fontWeight: "600" }}>SV</span>
          </div>
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>Sistema de Ventas</span>
        </div>

        <div style={{ display: "flex" }}>
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate({ to: link.to })}
              style={{
                padding: "0 16px",
                height: "56px",
                fontSize: "14px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom: currentPath === link.to ? "2px solid var(--accent)" : "2px solid transparent",
                color: currentPath === link.to ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "color 0.15s",
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={toggleDarkMode}
          style={{
            width: "32px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            fontSize: "15px",
          }}
          title={darkMode ? "Modo claro" : "Modo oscuro"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          onClick={handleLogout}
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

export default Navbar;