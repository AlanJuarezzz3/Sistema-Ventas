import { useNavigate } from "@tanstack/react-router";
import { isAdmin } from "../api/auth";

function Navbar() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate({ to: "/" });
  };

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 2rem",
      backgroundColor: "#1e1e2e",
      color: "#fff",
    }}>
      <span style={{ fontWeight: "500", fontSize: "18px" }}>Sistema de Ventas</span>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <button onClick={() => navigate({ to: "/productos" })} style={navBtn}>Productos</button>
        <button onClick={() => navigate({ to: "/clientes" })} style={navBtn}>Clientes</button>
        <button onClick={() => navigate({ to: "/ventas" })} style={navBtn}>Ventas</button>
        {admin && (
          <button onClick={() => navigate({ to: "/usuarios" })} style={navBtn}>Usuarios</button>
        )}
        <button onClick={handleLogout} style={{ ...navBtn, color: "#ff6b6b" }}>Cerrar sesión</button>
      </div>
    </nav>
  );
}

const navBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: "14px",
  cursor: "pointer",
};

export default Navbar;