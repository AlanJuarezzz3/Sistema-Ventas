import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarProductosPDF, exportarProductosExcel } from "../api/exportUtils";
import { s } from "../styles";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const admin = isAdmin();

  const fetchProductos = async () => {
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch {
      setError("Error al cargar productos");
    }
  };

  useEffect(() => {
    fetchProductos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!nombre || !precio || stock === "") return setError("Completá todos los campos");
    try {
      if (editId) {
        await api.put(`/productos/${editId}`, { nombre, precio, stock });
      } else {
        await api.post("/productos", { nombre, precio, stock });
      }
      setNombre(""); setPrecio(""); setStock("");
      setEditId(null); setError(""); setShowForm(false);
      fetchProductos();
    } catch {
      setError("Error al guardar producto");
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id); setNombre(p.nombre);
    setPrecio(p.precio); setStock(p.stock);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    } catch {
      setError("Error al eliminar producto");
    }
  };

  const handleCancelar = () => {
    setEditId(null); setNombre(""); setPrecio(""); setStock("");
    setError(""); setShowForm(false);
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideStock =
      filtroStock === "todos" ? true :
      filtroStock === "sinstock" ? p.stock === 0 :
      filtroStock === "pocostock" ? p.stock > 0 && p.stock <= 5 :
      filtroStock === "constock" ? p.stock > 5 : true;
    return coincideBusqueda && coincideStock;
  });

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
         <h2 style={{ ...s.title, fontSize: "24px" }}>Productos</h2>
<p style={{ ...s.subtitle, fontSize: "14px" }}>{productos.length} productos en total</p>
        </div>
        {admin && !showForm && (
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>
            + Agregar producto
          </button>
        )}
      </div>

      {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

      {admin && showForm && (
        <div style={{ ...s.card, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ ...s.subtitle, marginBottom: "1rem", fontWeight: "500", color: "var(--text-primary)" }}>
            {editId ? "Editar producto" : "Nuevo producto"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <label style={s.label}>Nombre</label>
              <input style={s.input} placeholder="Notebook Dell" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Precio</label>
              <input style={s.input} placeholder="1500" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Stock</label>
              <input style={s.input} placeholder="10" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSubmit} style={s.btnPrimary}>{editId ? "Actualizar" : "Guardar"}</button>
            <button onClick={handleCancelar} style={s.btnSecondary}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ ...s.input, width: "260px" }}
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select style={s.select} value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="constock">Con stock</option>
          <option value="pocostock">Poco stock (≤5)</option>
          <option value="sinstock">Sin stock</option>
        </select>
       <span style={{ ...s.muted, fontSize: "14px", color: "var(--text-secondary)" }}>{productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}</span>
        {admin && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button onClick={() => exportarProductosPDF(productosFiltrados)} style={s.btnPrimary}>Exportar PDF</button>
<button onClick={() => exportarProductosExcel(productosFiltrados)} style={s.btnPrimary}>Exportar Excel</button>
          </div>
        )}
      </div>

      <div style={{ ...s.card, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>Precio</th>
              <th style={s.th}>Stock</th>
              {admin && <th style={s.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={admin ? 5 : 4} style={{ ...s.td, textAlign: "center", color: "var(--text-muted)" }}>
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={s.tdMuted}>{p.id}</td>
                  <td style={{ ...s.td, fontWeight: "500" }}>{p.nombre}</td>
                  <td style={s.td}>${parseFloat(p.precio).toLocaleString("es-AR")}</td>
                  <td style={s.td}>
                    <span style={
                      p.stock === 0 ? s.badgeDanger :
                      p.stock <= 5 ? s.badgeWarning :
                      s.badgeSuccess
                    }>
                      {p.stock === 0 ? "Sin stock" : p.stock <= 5 ? `${p.stock} — poco` : p.stock}
                    </span>
                  </td>
                  {admin && (
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleEdit(p)} style={s.btnSmall}>Editar</button>
                        <button onClick={() => handleDelete(p.id)} style={s.btnDanger}>Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Productos;