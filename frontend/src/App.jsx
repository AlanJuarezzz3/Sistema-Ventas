import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import Login from "./pages/Login";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
import Ventas from "./pages/Ventas";
import Usuarios from "./pages/Usuarios";
import Navbar from "./components/Navbar";

const rootRoute = createRootRoute({
  component: () => {
    return <Outlet />;
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Login,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  beforeLoad: () => {
    if (!localStorage.getItem("token")) throw redirect({ to: "/" });
  },
  component: () => (
    <div>
      <Navbar />
      <div style={{ padding: "2rem" }}>
        <Outlet />
      </div>
    </div>
  ),
});

const productosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/productos",
  component: Productos,
});

const clientesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/clientes",
  component: Clientes,
});

const ventasRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/ventas",
  component: Ventas,
});

const usuariosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/usuarios",
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    if (!token) throw redirect({ to: "/" });
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.rol !== "admin") throw redirect({ to: "/productos" });
  },
  component: Usuarios,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    productosRoute,
    clientesRoute,
    ventasRoute,
    usuariosRoute,
  ]),
]);

const router = createRouter({ routeTree });

function App() {
  return <RouterProvider router={router} />;
}

export default App;