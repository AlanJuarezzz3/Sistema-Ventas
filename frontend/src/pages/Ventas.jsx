import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarVentasPDF, exportarVentasExcel } from "../api/exportUtils";

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState([{ producto_id: "", cantidad: "", precio_unitario: "" }]);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [showForm, setShowForm] = useState(false);
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

  const getStockDisponible = (producto_id) => {
    const prod = productos.find((p) => p.id === parseInt(producto_id));
    return prod ? prod.stock : null;
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
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear venta");
    }
  };

  const handleAnular = async (id) => {
    try {
      await api.put(`/ventas/${id}/anular`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al anular venta");
    }
  };

  const calcularTotal = () => {
    return items.reduce((acc, i) => {
      const cantidad = parseFloat(i.cantidad) || 0;
      const precio = parseFloat(i.precio_unitario) || 0;
      return acc + cantidad * precio;
    }, 0).toFixed(2);
  };

  const ventasFiltradas = ventas.filter((v) => {
    if (filtroEstado === "todas") return true;
    return v.estado === filtroEstado;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Ventas</h2>
          <p className="text-sm text-gray-500 mt-0.5">{ventas.length} ventas en total</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            + Nueva venta
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Nueva venta</h3>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">Cliente</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Seleccioná un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <label className="block text-xs text-gray-500 mb-2">Productos</label>
          {items.map((item, index) => {
            const stock = getStockDisponible(item.producto_id);
            return (
              <div key={index} className="mb-3">
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ flex: 2 }}
                    value={item.producto_id}
                    onChange={(e) => handleItemChange(index, "producto_id", e.target.value)}
                  >
                    <option value="">Seleccioná producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} — ${p.precio}</option>
                    ))}
                  </select>
                  <input
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ flex: 1 }}
                    placeholder="Cantidad"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
                  />
                  <input
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ flex: 1 }}
                    placeholder="Precio unitario"
                    value={item.precio_unitario}
                    onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-600 border border-red-100 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {item.producto_id && stock !== null && (
                  <p className={`text-xs mt-1 ml-1 ${stock === 0 ? "text-red-500" : stock <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                    Stock disponible: {stock}
                  </p>
                )}
              </div>
            );
          })}

          <button
            onClick={addItem}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-4"
          >
            + Agregar producto
          </button>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900">Total: ${calcularTotal()}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setError(""); setClienteId(""); setItems([{ producto_id: "", cantidad: "", precio_unitario: "" }]); }}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Crear venta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 items-center">
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="activa">Activas</option>
          <option value="anulada">Anuladas</option>
        </select>
        <span className="text-sm text-gray-400">
          {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? "s" : ""}
        </span>
        {admin && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => exportarVentasPDF(ventasFiltradas)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Exportar PDF
            </button>
            <button onClick={() => exportarVentasExcel(ventasFiltradas)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Exportar Excel
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
              {admin && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={admin ? 6 : 5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No se encontraron ventas
                </td>
              </tr>
            ) : (
              ventasFiltradas.map((v) => (
                <tr key={v.id} className={`border-b border-gray-50 transition-colors ${v.estado === "anulada" ? "opacity-50" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3 text-sm text-gray-400">{v.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.cliente_nombre}</td>
                  <td className={`px-4 py-3 text-sm text-gray-700 ${v.estado === "anulada" ? "line-through" : ""}`}>
                    ${parseFloat(v.total).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      v.estado === "activa"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(v.fecha).toLocaleDateString("es-AR")}
                  </td>
                  {admin && (
                    <td className="px-4 py-3">
                      {v.estado === "activa" && (
                        <button
                          onClick={() => handleAnular(v.id)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Anular
                        </button>
                      )}
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

export default Ventas;