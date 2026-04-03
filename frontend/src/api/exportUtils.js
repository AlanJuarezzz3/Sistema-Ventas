import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const exportarVentasPDF = (ventas) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Ventas", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

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
    headStyles: { fillColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportarVentasExcel = (ventas) => {
  const datos = ventas.map((v) => ({
    ID: v.id,
    Cliente: v.cliente_nombre,
    Total: parseFloat(v.total),
    Estado: v.estado,
    Fecha: new Date(v.fecha).toLocaleDateString("es-AR"),
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportarProductosPDF = (productos) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Productos", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

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

export const exportarClientesPDF = (clientes) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Clientes", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["ID", "Nombre", "Email", "Teléfono"]],
    body: clientes.map((c) => [
      c.id,
      c.nombre,
      c.email || "—",
      c.telefono || "—",
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
};

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