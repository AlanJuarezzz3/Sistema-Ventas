// Importa jsPDF para generar archivos PDF
import jsPDF from "jspdf";

// Importa autoTable para crear tablas dentro del PDF
import autoTable from "jspdf-autotable";

// Importa la librería XLSX para generar archivos Excel
import * as XLSX from "xlsx";

// Importa la instancia de axios configurada
import api from "./axios";

/**
 * Exporta una lista de ventas a PDF
 */
export const exportarVentasPDF = (ventas) => {
  // Crea un nuevo documento PDF
  const doc = new jsPDF();

  // Título del documento
  doc.setFontSize(16);
  doc.text("Reporte de Ventas", 14, 16);

  // Fecha de generación
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

  // Genera tabla con los datos de ventas
  autoTable(doc, {
    startY: 28,
    head: [["ID", "Cliente", "Total", "Estado", "Fecha"]],
    body: ventas.map((v) => [
      v.id,
      v.cliente_nombre,
      `$${parseFloat(v.total).toLocaleString("es-AR")}`,
      v.estado,
      new Date(v.fecha).toLocaleDateString("es-AR"),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 46] }, // Color del encabezado
    alternateRowStyles: { fillColor: [245, 245, 245] }, // Filas alternadas
  });

  // Descarga el archivo PDF
  doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Exporta una lista de ventas a Excel
 */
export const exportarVentasExcel = (ventas) => {
  // Mapea los datos a un formato plano
  const datos = ventas.map((v) => ({
    ID: v.id,
    Cliente: v.cliente_nombre,
    Total: parseFloat(v.total),
    Estado: v.estado,
    Fecha: new Date(v.fecha).toLocaleDateString("es-AR"),
  }));

  // Convierte JSON a hoja de Excel
  const ws = XLSX.utils.json_to_sheet(datos);

  // Crea un libro de Excel
  const wb = XLSX.utils.book_new();

  // Agrega la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");

  // Descarga el archivo Excel
  XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Exporta una lista de productos a PDF
 */
export const exportarProductosPDF = (productos) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text("Reporte de Productos", 14, 16);

  // Fecha
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

  // Tabla de productos
  autoTable(doc, {
    startY: 28,
    head: [["ID", "Nombre", "Precio", "Stock"]],
    body: productos.map((p) => [
      p.id,
      p.nombre,
      `$${parseFloat(p.precio).toLocaleString("es-AR")}`,
      p.stock,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`productos_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Exporta una lista de productos a Excel
 */
export const exportarProductosExcel = (productos) => {
  const datos = productos.map((p) => ({
    ID: p.id,
    Nombre: p.nombre,
    Precio: parseFloat(p.precio),
    Stock: p.stock,
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  XLSX.writeFile(wb, `productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Exporta una lista de clientes a PDF
 */
export const exportarClientesPDF = (clientes) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text("Reporte de Clientes", 14, 16);

  // Fecha
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

  // Tabla de clientes
  autoTable(doc, {
    startY: 28,
    head: [["ID", "Nombre", "Email", "Teléfono"]],
    body: clientes.map((c) => [
      c.id,
      c.nombre,
      c.email || "—", // Valor por defecto si no hay email
      c.telefono || "—", // Valor por defecto si no hay teléfono
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Exporta una lista de clientes a Excel
 */
export const exportarClientesExcel = (clientes) => {
  const datos = clientes.map((c) => ({
    ID: c.id,
    Nombre: c.nombre,
    Email: c.email || "",
    Telefono: c.telefono || "",
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");

  XLSX.writeFile(wb, `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Genera un PDF tipo recibo para una venta específica
 * Obtiene los datos desde el backend
 */
export const generarReciboPDF = async (venta_id) => {
  // Hace request al backend para obtener la venta completa
  const res = await api.get(`/ventas/${venta_id}`);
  const venta = res.data;

  // Crea documento PDF
  const doc = new jsPDF();

  // Encabezado (fondo oscuro)
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, 210, 40, "F");

  // Texto del encabezado
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Recibo de Pago", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Ventas", 14, 28);
  doc.text(`Fecha: ${new Date(venta.fecha).toLocaleDateString("es-AR")}`, 14, 35);

  // Datos de la venta
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Datos de la venta", 14, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`N° de venta: #${venta.id}`, 14, 63);
  doc.text(`Cliente: ${venta.cliente_nombre}`, 14, 70);
  doc.text(`Estado: PAGADA`, 14, 77);

  // Tabla con detalle de productos
  autoTable(doc, {
    startY: 88,
    head: [["Producto", "Cantidad", "Precio unitario", "Subtotal"]],
    body: venta.detalle.map((d) => [
      d.producto_nombre,
      d.cantidad,
      `$${parseFloat(d.precio_unitario).toLocaleString("es-AR")}`,
      `$${parseFloat(d.subtotal).toLocaleString("es-AR")}`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Posición final luego de la tabla
  const finalY = doc.lastAutoTable.finalY + 10;

  // Total de la venta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: $${parseFloat(venta.total).toLocaleString("es-AR")}`, 14, finalY);

  // Texto final
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Gracias por su compra. Este documento es válido como comprobante de pago.", 14, finalY + 12);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}`, 14, finalY + 18);

  // Descarga el recibo
  doc.save(`recibo_venta_${venta_id}.pdf`);
};