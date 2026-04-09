import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarVentasPDF, exportarVentasExcel, generarReciboPDF } from "../api/exportUtils";
import { s } from "../styles";
import ConfirmModal from "../components/ConfirmModal";
import QRPago from "../components/QRPago";

const ITEMS_POR_PAGINA = 10;

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState([{ producto_id: "", cantidad: "", precio_unitario: "" }]);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("desc");
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [pagandoId, setPagandoId] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [qrVenta, setQrVenta] = useState(null);
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

  useEffect(() => {
    setPagina(1);
  }, [filtroEstado, busquedaCliente, ordenFecha]);

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

  const handleAnular = (id) => {
    setConfirm({
      titulo: "Anular venta",
      mensaje: `¿Estás seguro que querés anular la venta #${id}? El stock de los productos se va a restaurar automáticamente.`,
      accion: async () => {
        try {
          await api.put(`/ventas/${id}/anular`);
          fetchData();
        } catch (err) {
          setError(err.response?.data?.mensaje || "Error al anular venta");
        }
      }
    });
  };

  const handleEliminar = (id) => {
    setConfirm({
      titulo: "Eliminar venta definitivamente",
      mensaje: `¿Estás seguro que querés eliminar la venta #${id} del historial? Esta acción es irreversible.`,
      accion: async () => {
        try {
          await api.delete(`/ventas/${id}`);
          fetchData();
        } catch (err) {
          setError(err.response?.data?.mensaje || "Error al eliminar venta");
        }
      }
    });
  };

  const handlePagar = async (id) => {
    setPagandoId(id);
    try {
      const res = await api.post(`/pagos/pagar/${id}`);
      window.open(res.data.url, "_blank");
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al generar el pago");
    } finally {
      setPagandoId(null);
    }
  };

  const handleMarcarPagada = (id) => {
    setConfirm({
      titulo: "Marcar venta como pagada",
      mensaje: `¿Confirmás que la venta #${id} fue pagada? Esta acción no se puede deshacer.`,
      accion: async () => {
        try {
          await api.put(`/ventas/${id}/pagada`);
          fetchData();
        } catch (err) {
          setError(err.response?.data?.mensaje || "Error al marcar venta como pagada");
        }
      }
    });
  };

  const handleReciboPDF = async (id) => {
    try {
      await generarReciboPDF(id);
    } catch {
      setError("Error al generar el recibo PDF");
    }
  };

  const calcularTotal = () => {
    return items.reduce((acc, i) => {
      const cantidad = parseFloat(i.cantidad) || 0;
      const precio = parseFloat(i.precio_unitario) || 0;
      return acc + cantidad * precio;
    }, 0).toFixed(2);
  };

  const ventasFiltradas = ventas
    .filter((v) => {
      const coincideEstado = filtroEstado === "todas" ? true : v.estado === filtroEstado;
      const coincideCliente = v.cliente_nombre.toLowerCase().includes(busquedaCliente.toLowerCase());
      return coincideEstado && coincideCliente;
    })
    .sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return ordenFecha === "desc" ? fechaB - fechaA : fechaA - fechaB;
    });

  const totalPaginas = Math.ceil(ventasFiltradas.length / ITEMS_POR_PAGINA);
  const ventasPaginadas = ventasFiltradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  const cambiarPagina = (nueva) => {
    if (nueva >= 1 && nueva <= totalPaginas) setPagina(nueva);
  };

  const getBadgeEstado = (estado) => {
    if (estado === "activa") return s.badgeSuccess;
    if (estado === "pagada") return { ...s.badgeSuccess, backgroundColor: "#064e3b", color: "#34d399" };
    return s.badgeMuted;
  };

  const getRowStyle = (estado) => {
    if (estado === "pagada") return { backgroundColor: "rgba(16, 185, 129, 0.05)", transition: "background 0.15s" };
    if (estado === "anulada") return { opacity: 0.6, transition: "background 0.15s" };
    return { transition: "background 0.15s" };
  };

  return (
    <div style={{ padding: "2rem" }}>
      {confirm && (
        <ConfirmModal
          titulo={confirm.titulo}
          mensaje={confirm.mensaje}
          onConfirmar={() => { confirm.accion(); setConfirm(null); }}
          onCancelar={() => setConfirm(null)}
        />
      )}

      {qrVenta && (
        <QRPago
          ventaId={qrVenta.id}
          total={qrVenta.total}
          clienteNombre={qrVenta.cliente_nombre}
          onCerrar={() => { setQrVenta(null); fetchData(); }}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ ...s.title, fontSize: "24px" }}>Ventas</h2>
          <p style={{ ...s.subtitle, fontSize: "14px" }}>{ventas.length} ventas en total</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>
            + Nueva venta
          </button>
        )}
      </div>

      {error && <div style={{ ...s.error, marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <div style={{ ...s.card, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1rem" }}>
            Nueva venta
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <label style={s.label}>Cliente</label>
            <select style={{ ...s.select, width: "100%" }} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Seleccioná un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <label style={s.label}>Productos</label>
          {items.map((item, index) => {
            const stock = getStockDisponible(item.producto_id);
            return (
              <div key={index} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select style={{ ...s.select, flex: 2 }} value={item.producto_id} onChange={(e) => handleItemChange(index, "producto_id", e.target.value)}>
                    <option value="">Seleccioná producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} — ${p.precio}</option>
                    ))}
                  </select>
                  <input style={{ ...s.input, flex: 1 }} placeholder="Cantidad" value={item.cantidad} onChange={(e) => handleItemChange(index, "cantidad", e.target.value)} />
                  <input style={{ ...s.input, flex: 1 }} placeholder="Precio unitario" value={item.precio_unitario} onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(index)} style={s.btnDanger}>✕</button>
                  )}
                </div>
                {item.producto_id && stock !== null && (
                  <p style={{ fontSize: "12px", marginTop: "4px", marginLeft: "2px", color: stock === 0 ? "var(--danger)" : stock <= 5 ? "var(--warning)" : "var(--success)" }}>
                    Stock disponible: {stock}
                  </p>
                )}
              </div>
            );
          })}
          <button onClick={addItem} style={{ ...s.btnSecondary, fontSize: "13px", padding: "6px 12px", marginBottom: "1rem" }}>
            + Agregar producto
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <p style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: "500" }}>Total: ${calcularTotal()}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setShowForm(false); setError(""); setClienteId(""); setItems([{ producto_id: "", cantidad: "", precio_unitario: "" }]); }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={handleSubmit} style={s.btnPrimary}>Crear venta</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ ...s.input, width: "220px" }}
          placeholder="Buscar por cliente..."
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
        />
        <select style={s.select} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="activa">Activas</option>
          <option value="pagada">Pagadas</option>
          <option value="anulada">Anuladas</option>
        </select>
        <button
          onClick={() => setOrdenFecha(ordenFecha === "desc" ? "asc" : "desc")}
          style={{ ...s.btnSmall, display: "flex", alignItems: "center", gap: "4px" }}
        >
          Fecha {ordenFecha === "desc" ? "↓" : "↑"}
        </button>
        <span style={{ ...s.muted, fontSize: "14px", color: "var(--text-secondary)" }}>
          {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? "s" : ""}
        </span>
        {admin && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button onClick={() => exportarVentasPDF(ventasFiltradas)} style={s.btnPrimary}>Exportar PDF</button>
            <button onClick={() => exportarVentasExcel(ventasFiltradas)} style={s.btnPrimary}>Exportar Excel</button>
          </div>
        )}
      </div>

      <div style={{ ...s.card, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
  <tr>
    <th style={s.th}>ID</th>
    <th style={s.th}>Cliente</th>
    <th style={s.th}>Total</th>
    <th style={s.th}>Estado</th>
    <th style={s.th}>Fecha</th>
    <th style={s.th}>Vendedor</th>
    <th style={s.th}>Acciones</th>
    <th style={s.th}>Pagos</th>
  </tr>
</thead>
          <tbody>
            {ventasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...s.td, textAlign: "center", color: "var(--text-muted)" }}>
                  No se encontraron ventas
                </td>
              </tr>
            ) : (
              ventasPaginadas.map((v) => (
                <tr key={v.id}
                  style={getRowStyle(v.estado)}
                  onMouseEnter={(e) => { if (v.estado !== "pagada") e.currentTarget.style.backgroundColor = "var(--bg-input)"; }}
                  onMouseLeave={(e) => { if (v.estado === "pagada") e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.05)"; else e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <td style={s.tdMuted}>{v.id}</td>
                  <td style={{ ...s.td, fontWeight: "500" }}>{v.cliente_nombre}</td>
                  <td style={{ ...s.td, textDecoration: v.estado === "anulada" ? "line-through" : "none", color: v.estado === "pagada" ? "var(--success)" : "var(--text-primary)", fontWeight: v.estado === "pagada" ? "500" : "400" }}>
                    ${parseFloat(v.total).toLocaleString("es-AR")}
                  </td>
                  <td style={s.td}>
                    <span style={getBadgeEstado(v.estado)}>
                      {v.estado === "pagada" ? "✓ pagada" : v.estado}
                    </span>
                  </td>
                  <td style={s.td}>{new Date(v.fecha).toLocaleDateString("es-AR")}</td>
<td style={s.td}>
  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
    {v.vendedor_nombre || "—"}
  </span>
</td>
                  <td style={s.td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {v.estado === "activa" && admin && (
                        <button onClick={() => handleAnular(v.id)} style={s.btnDanger}>Anular</button>
                      )}
                      {v.estado === "anulada" && admin && (
                        <button onClick={() => handleEliminar(v.id)} title="Eliminar definitivamente" style={{ ...s.btnDanger, padding: "4px 10px", fontSize: "15px" }}>🗑️</button>
                      )}
                      {v.estado === "pagada" && (
                        <span style={{ fontSize: "13px", color: "var(--success)" }}>✓ Completada</span>
                      )}
                    </div>
                  </td>
                  <td style={s.td}>
                    {v.estado === "activa" && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handlePagar(v.id)}
                          disabled={pagandoId === v.id}
                          style={{ ...s.btnSmall, backgroundColor: "#f59e0b", color: "#fff", border: "none", fontWeight: "600", letterSpacing: "0.05em", opacity: pagandoId === v.id ? 0.7 : 1 }}
                        >
                          {pagandoId === v.id ? "..." : "💳 PAGAR"}
                        </button>
                        <button
                          onClick={() => setQrVenta(v)}
                          style={{ ...s.btnSmall, backgroundColor: "#0ea5e9", color: "#fff", border: "none", fontWeight: "600", letterSpacing: "0.05em" }}
                        >
                          📱 QR
                        </button>
                        {admin && (
                          <button
                            onClick={() => handleMarcarPagada(v.id)}
                            style={{ ...s.btnSmall, backgroundColor: "var(--success)", color: "#fff", border: "none", fontWeight: "500", fontSize: "12px" }}
                          >
                            ✓ Marcar pagada
                          </button>
                        )}
                      </div>
                    )}
                    {v.estado === "pagada" && (
                      <button
                        onClick={() => handleReciboPDF(v.id)}
                        style={{ ...s.btnSmall, backgroundColor: "#1e1e2e", color: "#fff", border: "none", fontWeight: "500", fontSize: "12px" }}
                      >
                        📄 Recibo PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
            <span style={s.muted}>Página {pagina} de {totalPaginas}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => cambiarPagina(1)} disabled={pagina === 1} style={{ ...s.btnSmall, opacity: pagina === 1 ? 0.4 : 1 }}>«</button>
              <button onClick={() => cambiarPagina(pagina - 1)} disabled={pagina === 1} style={{ ...s.btnSmall, opacity: pagina === 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  p === "..." ? (
                    <span key={`dots-${i}`} style={{ ...s.muted, padding: "4px 8px" }}>...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => cambiarPagina(p)}
                      style={{ ...s.btnSmall, backgroundColor: pagina === p ? "var(--accent)" : "transparent", color: pagina === p ? "#fff" : "var(--text-secondary)", border: pagina === p ? "none" : "1px solid var(--border)" }}
                    >
                      {p}
                    </button>
                  )
                ))
              }
              <button onClick={() => cambiarPagina(pagina + 1)} disabled={pagina === totalPaginas} style={{ ...s.btnSmall, opacity: pagina === totalPaginas ? 0.4 : 1 }}>›</button>
              <button onClick={() => cambiarPagina(totalPaginas)} disabled={pagina === totalPaginas} style={{ ...s.btnSmall, opacity: pagina === totalPaginas ? 0.4 : 1 }}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ventas;