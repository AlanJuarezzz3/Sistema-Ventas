import { useNavigate, useRouterState } from "@tanstack/react-router";
import { isAdmin } from "../api/auth";

function Navbar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const admin = isAdmin();

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
    <nav className="bg-gray-900 text-white px-6 py-0 flex items-center justify-between h-14 border-b border-gray-800">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-gray-900 text-xs font-medium">SV</span>
          </div>
          <span className="text-sm font-medium">Sistema de Ventas</span>
        </div>

        <div className="flex items-center">
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate({ to: link.to })}
              className={`px-4 h-14 text-sm transition-colors cursor-pointer border-b-2 ${
                currentPath === link.to
                  ? "text-white border-white"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}

export default Navbar;