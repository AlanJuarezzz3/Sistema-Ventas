import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarClientesPDF, exportarClientesExcel } from "../api/exportUtils";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const admin = isAdmin();
  const navigate = useNavigate();

  const fetchClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch {
      setError("Error al cargar clientes");
    }
  };

  useEffect(() => {
    fetchClientes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!nombre) return setError("El nombre es obligatorio");
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, { nombre, email, telefono });
      } else {
        await api.post("/clientes", { nombre, email, telefono });
      }
      setNombre("");
      setEmail("");
      setTelefono("");
      setEditId(null);
      setError("");
      setShowForm(false);
      fetchClientes();
    } catch {
      setError("Error al guardar cliente");
    }
  };

  const handleEdit = (cliente) => {
    setEditId(cliente.id);
    setNombre(cliente.nombre);
    setEmail(cliente.email || "");
    setTelefono(cliente.telefono || "");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    } catch {
      setError("Error al eliminar cliente");
    }
  };

  const handleCancelar = () => {
    setEditId(null);
    setNombre("");
    setEmail("");
    setTelefono("");
    setError("");
    setShowForm(false);
  };

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(texto) ||
      (c.email && c.email.toLowerCase().includes(texto)) ||
      (c.telefono && c.telefono.includes(texto))
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} clientes en total</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            + Agregar cliente
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
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editId ? "Editar cliente" : "Nuevo cliente"}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nombre</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="juan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Teléfono</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="1134567890"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors w-72"
          placeholder="Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <span className="text-sm text-gray-400">
          {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? "s" : ""}
        </span>
        {admin && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => exportarClientesPDF(clientesFiltrados)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Exportar PDF
            </button>
            <button onClick={() => exportarClientesExcel(clientesFiltrados)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{c.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.telefono || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate({ to: `/clientes/${c.id}/historial` })}
                        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Historial
                      </button>
                      {admin && (
                        <>
                          <button onClick={() => handleEdit(c)} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes;