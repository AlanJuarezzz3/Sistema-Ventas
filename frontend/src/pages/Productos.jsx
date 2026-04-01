import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
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
      setNombre("");
      setPrecio("");
      setStock("");
      setEditId(null);
      setError("");
      fetchProductos();
    } catch {
      setError("Error al guardar producto");
    }
  };

  const handleEdit = (producto) => {
    setEditId(producto.id);
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setStock(producto.stock);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    } catch {
      setError("Error al eliminar producto");
    }
  };

  return (
    <div>
      <h2 style={titleStyle}>Productos</h2>

      {error && <p style={errorStyle}>{error}</p>}

      {admin && (
        <div style={formStyle}>
          <input
            style={inputStyle}
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <button onClick={handleSubmit} style={btnStyle}>
            {editId ? "Actualizar" : "Agregar"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setNombre(""); setPrecio(""); setStock(""); }} style={cancelStyle}>
              Cancelar
            </button>
          )}
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Precio</th>
            <th style={thStyle}>Stock</th>
            {admin && <th style={thStyle}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.id}</td>
              <td style={tdStyle}>{p.nombre}</td>
              <td style={tdStyle}>${p.precio}</td>
              <td style={tdStyle}>
                <span style={p.stock === 0 ? sinStockBadge : p.stock <= 5 ? pocoStockBadge : stockBadge}>
                  {p.stock}
                </span>
              </td>
              {admin && (
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(p)} style={editBtn}>Editar</button>
                  <button onClick={() => handleDelete(p.id)} style={deleteBtn}>Eliminar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const titleStyle = { fontSize: "20px", fontWeight: "500", marginBottom: "1.5rem" };
const errorStyle = { color: "#c0392b", fontSize: "13px", marginBottom: "1rem" };
const formStyle = { display: "flex", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" };
const inputStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", minWidth: "180px" };
const btnStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "#1e1e2e", color: "#fff", cursor: "pointer" };
const cancelStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "transparent", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };
const editBtn = { marginRight: "8px", padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ccc", borderRadius: "6px", cursor: "pointer", background: "transparent" };
const deleteBtn = { padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ffb3b3", borderRadius: "6px", cursor: "pointer", background: "transparent", color: "#c0392b" };
const stockBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#e6faf0", color: "#0f6e56", fontWeight: "500" };
const pocoStockBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#fff8e1", color: "#7a5a00", fontWeight: "500" };
const sinStockBadge = { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", background: "#fdecea", color: "#991a1a", fontWeight: "500" };

export default Productos;