import { useState, useEffect } from "react";
import api from "../api/axios";
import { isAdmin } from "../api/auth";
import { exportarProductosPDF, exportarProductosExcel } from "../api/exportUtils";
import { s } from "../styles";
import ConfirmModal from "../components/ConfirmModal";
import * as XLSX from "xlsx";

const ITEMS_POR_PAGINA = 10;

const CATEGORIAS = [
  "Periféricos",
  "Monitores",
  "Componentes",
  "Gabinetes y fuentes",
  "Notebooks",
  "Accesorios",
  "Usados"
];

function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [categoria, setCategoria] = useState("Sin categoría");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState("aumento");
  const [ajustePorcentaje, setAjustePorcentaje] = useState("");
  const [ajusteCategoria, setAjusteCategoria] = useState("todas");
  const [ajusteMsg, setAjusteMsg] = useState("");
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
      const body = { nombre, precio, stock, categoria };
      if (editId) {
        await api.put(`/productos/${editId}`, body);
      } else {
        await api.post("/productos", body);
      }
      setNombre(""); setPrecio(""); setStock(""); setCategoria("Sin categoría");
      setEditId(null); setError(""); setShowForm(false);
      fetchProductos();
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al guardar producto");
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setNombre(p.nombre);
    setPrecio(p.precio);
    setStock(p.stock);
    setCategoria(p.categoria || "Sin categoría");
    setShowForm(true);
  };

  const handleDelete = (id, nombre) => {
    setConfirm({
      titulo: "Eliminar producto",
      mensaje: `¿Estás seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      accion: async () => {
        try {
          await api.delete(`/productos/${id}`);
          fetchProductos();
        } catch {
          setError("Error al eliminar producto");
        }
      }
    });
  };

  const handleCancelar = () => {
    setEditId(null); setNombre(""); setPrecio(""); setStock("");
    setCategoria("Sin categoría"); setError(""); setShowForm(false);
  };

  const handleAjustarPrecios = async () => {
    if (!ajustePorcentaje || isNaN(ajustePorcentaje) || ajustePorcentaje <= 0)
      return setAjusteMsg("Ingresá un porcentaje válido");

    const categoriaTexto = ajusteCategoria === "todas" ? "todos los productos" : `los productos de "${ajusteCategoria}"`;
    const tipoTexto = ajusteTipo === "aumento" ? "aumentar" : "reducir";

    setShowAjuste(false);
    setConfirm({
      titulo: "Confirmar ajuste de precios",
      mensaje: `¿Estás seguro que querés ${tipoTexto} el precio de ${categoriaTexto} un ${ajustePorcentaje}%? Esta acción modifica los precios en la base de datos.`,
      accion: async () => {
        try {
          const res = await api.put("/productos/ajustar-precios", {
            tipo: ajusteTipo,
            porcentaje: parseFloat(ajustePorcentaje),
            categoria: ajusteCategoria
          });
          fetchProductos();
          setAjustePorcentaje("");
          setAjusteCategoria("todas");
          setAjusteTipo("aumento");
          setError("");
          alert(res.data.mensaje + ` (${res.data.productosAfectados} productos afectados)`);
        } catch (err) {
          setError(err.response?.data?.mensaje || "Error al ajustar precios");
        }
      }
    });
  };

  const handleImportarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(sheet);

        if (datos.length === 0) return setError("El archivo está vacío");

        const productosImportados = datos.map(row => ({
          nombre: row["Nombre"] || row["nombre"] || "",
          precio: row["Precio"] || row["precio"] || 0,
          stock: row["Stock"] || row["stock"] || 0,
          categoria: row["Categoria"] || row["categoria"] || row["Categoría"] || ""
        }));

        const res = await api.post("/productos/importar", { productos: productosImportados });
        setError("");
        alert(`✅ ${res.data.mensaje}: ${res.data.insertados} insertados, ${res.data.duplicados} duplicados ignorados`);
        fetchProductos();
      } catch (err) {
        setError(err.response?.data?.mensaje || "Error al importar el archivo");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideStock =
      filtroStock === "todos" ? true :
      filtroStock === "sinstock" ? p.stock === 0 :
      filtroStock === "pocostock" ? p.stock > 0 && p.stock <= 5 :
      filtroStock === "constock" ? p.stock > 5 : true;
    const coincideCategoria =
      filtroCategoria === "todas" ? true : p.categoria === filtroCategoria;
    return coincideBusqueda && coincideStock && coincideCategoria;
  });

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA);
  const productosPaginados = productosFiltrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  const cambiarPagina = (nueva) => {
    if (nueva >= 1 && nueva <= totalPaginas) setPagina(nueva);
  };

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroStock, filtroCategoria]);

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

      {showAjuste && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            ...s.card, padding: "1.5rem", width: "420px",
            display: "flex", flexDirection: "column", gap: "1rem"
          }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: "600", margin: 0 }}>
              Ajustar precios
            </h3>
            <div>
              <label style={s.label}>Tipo de ajuste</label>
              <select style={s.select} value={ajusteTipo} onChange={(e) => setAjusteTipo(e.target.value)}>
                <option value="aumento">📈 Aumento</option>
                <option value="descuento">📉 Descuento</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Porcentaje (%)</label>
              <input
                style={s.input}
                placeholder="Ej: 15"
                type="number"
                min="1"
                max="100"
                value={ajustePorcentaje}
                onChange={(e) => setAjustePorcentaje(e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Aplicar a</label>
              <select style={s.select} value={ajusteCategoria} onChange={(e) => setAjusteCategoria(e.target.value)}>
                <option value="todas">Todas las categorías</option>
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {ajusteMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
                backgroundColor: ajusteMsg.includes("correctamente") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: ajusteMsg.includes("correctamente") ? "#4ade80" : "#f87171",
                border: `1px solid ${ajusteMsg.includes("correctamente") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`
              }}>
                {ajusteMsg}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowAjuste(false); setAjustePorcentaje(""); setAjusteMsg(""); }}
                style={s.btnSecondary}
              >
                Cancelar
              </button>
              <button onClick={handleAjustarPrecios} style={s.btnPrimary}>
                Confirmar ajuste
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", marginBottom: "1rem" }}>
            {editId ? "Editar producto" : "Nuevo producto"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
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
            <div>
              <label style={s.label}>Categoría</label>
              <select style={s.select} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="Sin categoría">Sin categoría</option>
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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
          style={{ ...s.input, width: "220px" }}
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select style={s.select} value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select style={s.select} value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="constock">Con stock</option>
          <option value="pocostock">Poco stock (≤5)</option>
          <option value="sinstock">Sin stock</option>
        </select>
        <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
        </span>
        {admin && (
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
  <button onClick={() => setShowAjuste(true)} style={s.btnSecondary}>
    💲 Ajustar precios
  </button>
  <label style={{ ...s.btnSecondary, cursor: "pointer" }}>
    📥 Importar Excel
    <input
      type="file"
      accept=".xlsx,.xls"
      style={{ display: "none" }}
      onChange={handleImportarExcel}
    />
  </label>
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
              <th style={s.th}>Categoría</th>
              <th style={s.th}>Precio</th>
              <th style={s.th}>Stock</th>
              {admin && <th style={s.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosPaginados.length === 0 ? (
              <tr>
                <td colSpan={admin ? 6 : 5} style={{ ...s.td, textAlign: "center", color: "var(--text-muted)" }}>
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productosPaginados.map((p) => (
                <tr key={p.id}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={s.tdMuted}>{p.id}</td>
                  <td style={{ ...s.td, fontWeight: "500" }}>{p.nombre}</td>
                  <td style={s.td}>
                    <span style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)"
                    }}>
                      {p.categoria || "Sin categoría"}
                    </span>
                  </td>
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
                        <button onClick={() => handleDelete(p.id, p.nombre)} style={s.btnDanger}>Eliminar</button>
                      </div>
                    </td>
                  )}
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
                      style={{
                        ...s.btnSmall,
                        backgroundColor: pagina === p ? "var(--accent)" : "transparent",
                        color: pagina === p ? "#fff" : "var(--text-secondary)",
                        border: pagina === p ? "none" : "1px solid var(--border)",
                      }}
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

export default Productos;