import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState([{ producto_id: "", cantidad: "", precio_unitario: "" }]);
  const [error, setError] = useState("");
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const [ventasRes, clientesRes, productosRes] = await Promise.all([
        api.get("/ventas"),
        api.get("/clientes"),
        api.get("/productos"),
      ]);
      setVentas(ventasRes.data);
      setClientes(clientesRes.data);
      setProductos(productosRes.data);
    } catch {
      setError("Error al cargar datos");
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "producto_id") {
      const prod = productos.find((p) => p.id === parseInt(value));
      if (prod) newItems[index].precio_unitario = prod.precio;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { producto_id: "", cantidad: "", precio_unitario: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!clienteId) return setError("Seleccioná un cliente");
    if (items.some((i) => !i.producto_id || !i.cantidad || !i.precio_unitario)) {
      return setError("Completá todos los productos");
    }
    try {
      await api.post("/ventas", {
        cliente_id: parseInt(clienteId),
        productos: items.map((i) => ({
          producto_id: parseInt(i.producto_id),
          cantidad: parseInt(i.cantidad),
          precio_unitario: parseFloat(i.precio_unitario),
        })),
      });
      setClienteId("");
      setItems([{ producto_id: "", cantidad: "", precio_unitario: "" }]);
      setError("");
      fetchData();
    } catch {
      setError("Error al crear venta");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ventas/${id}`);
      fetchData();
    } catch {
      setError("Error al eliminar venta");
    }
  };

  return (
    <div>
      <h2 style={titleStyle}>Ventas</h2>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={cardStyle}>
        <h3 style={subtitleStyle}>Nueva venta</h3>

        <label style={labelStyle}>Cliente</label>
        <select style={selectStyle} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Seleccioná un cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <label style={{ ...labelStyle, marginTop: "1rem" }}>Productos</label>
        {items.map((item, index) => (
          <div key={index} style={itemRowStyle}>
            <select
              style={{ ...selectStyle, flex: 2, marginBottom: 0 }}
              value={item.producto_id}
              onChange={(e) => handleItemChange(index, "producto_id", e.target.value)}
            >
              <option value="">Seleccioná producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Cantidad"
              value={item.cantidad}
              onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Precio unitario"
              value={item.precio_unitario}
              onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
            />
            {items.length > 1 && (
              <button onClick={() => removeItem(index)} style={removeBtnStyle}>✕</button>
            )}
          </div>
        ))}

        <button onClick={addItem} style={addItemBtn}>+ Agregar producto</button>
        <button onClick={handleSubmit} style={btnStyle}>Crear venta</button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Fecha</th>
            {admin && <th style={thStyle}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id}>
              <td style={tdStyle}>{v.id}</td>
              <td style={tdStyle}>{v.cliente_nombre}</td>
              <td style={tdStyle}>${v.total}</td>
              <td style={tdStyle}>{new Date(v.fecha).toLocaleDateString("es-AR")}</td>
              {admin && (
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(v.id)} style={deleteBtn}>Eliminar</button>
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
const subtitleStyle = { fontSize: "15px", fontWeight: "500", marginBottom: "1rem" };
const errorStyle = { color: "#c0392b", fontSize: "13px", marginBottom: "1rem" };
const cardStyle = { background: "#fff", border: "0.5px solid #ddd", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem" };
const labelStyle = { display: "block", fontSize: "13px", color: "#555", marginBottom: "6px" };
const selectStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", width: "100%", marginBottom: "8px" };
const inputStyle = { padding: "8px 10px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px" };
const itemRowStyle = { display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" };
const removeBtnStyle = { padding: "6px 10px", fontSize: "13px", border: "0.5px solid #ffb3b3", borderRadius: "6px", cursor: "pointer", background: "transparent", color: "#c0392b" };
const addItemBtn = { display: "block", marginBottom: "1rem", padding: "6px 14px", fontSize: "13px", border: "0.5px solid #ccc", borderRadius: "8px", cursor: "pointer", background: "transparent" };
const btnStyle = { padding: "8px 16px", fontSize: "14px", border: "0.5px solid #ccc", borderRadius: "8px", background: "#1e1e2e", color: "#fff", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "13px", color: "#555", borderBottom: "0.5px solid #ddd" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "0.5px solid #eee" };
const deleteBtn = { padding: "4px 12px", fontSize: "13px", border: "0.5px solid #ffb3b3", borderRadius: "6px", cursor: "pointer", background: "transparent", color: "#c0392b" };

export default Ventas;