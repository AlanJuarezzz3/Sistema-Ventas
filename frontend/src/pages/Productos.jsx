import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarProductosPDF, exportarProductosExcel } from "../api/exportUtils";

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
      setNombre("");
      setPrecio("");
      setStock("");
      setEditId(null);
      setError("");
      setShowForm(false);
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
    setEditId(null);
    setNombre("");
    setPrecio("");
    setStock("");
    setError("");
    setShowForm(false);
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{productos.length} productos en total</p>
        </div>
        {admin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            + Agregar producto
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {admin && showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editId ? "Editar producto" : "Nuevo producto"}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nombre</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Notebook Dell"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Precio</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="1500"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Stock</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              {editId ? "Actualizar" : "Guardar"}
            </button>
            <button onClick={handleCancelar} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 items-center">
        <input
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors w-64"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          value={filtroStock}
          onChange={(e) => setFiltroStock(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="constock">Con stock</option>
          <option value="pocostock">Poco stock (≤5)</option>
          <option value="sinstock">Sin stock</option>
        </select>
        <span className="text-sm text-gray-400">
          {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
        </span>
        {admin && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => exportarProductosPDF(productosFiltrados)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Exportar PDF
            </button>
            <button onClick={() => exportarProductosExcel(productosFiltrados)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Precio</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</th>
              {admin && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={admin ? 5 : 4} className="px-4 py-8 text-center text-sm text-gray-400">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{p.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">${parseFloat(p.precio).toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.stock === 0
                        ? "bg-red-50 text-red-700"
                        : p.stock <= 5
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {p.stock === 0 ? "Sin stock" : p.stock <= 5 ? `${p.stock} — poco stock` : p.stock}
                    </span>
                  </td>
                  {admin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                          Eliminar
                        </button>
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