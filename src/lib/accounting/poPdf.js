import { jsPDF } from 'jspdf';

export function buildPurchaseOrderPdfBase64(po, vendor) {
  const doc = new jsPDF();
  const margin = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`PO #: ${po.po_number || '—'}`, margin, y);
  doc.text(`Date: ${new Date().toISOString().slice(0, 10)}`, 120, y);
  y += 6;
  doc.text(`Vendor: ${vendor?.name || po.vendor_name || '—'}`, margin, y);
  y += 5;
  if (vendor?.email) doc.text(`Email: ${vendor.email}`, margin, y);
  y += 5;
  if (po.needed_by) doc.text(`Needed by: ${po.needed_by}`, margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Line items', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const headers = ['Part / Description', 'Qty', 'Unit $', 'Total'];
  const colX = [margin, 110, 135, 165];
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 5;
  doc.line(margin, y, 195, y);
  y += 5;

  (po.line_items || []).forEach(line => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    const desc = `${line.part_number || ''} ${line.description || ''}`.trim().slice(0, 45);
    const qty = String(line.quantity || 0);
    const unit = `$${Number(line.unit_cost || 0).toFixed(2)}`;
    const total = `$${Number(line.total || line.quantity * line.unit_cost || 0).toFixed(2)}`;
    doc.text(desc, colX[0], y);
    doc.text(qty, colX[1], y);
    doc.text(unit, colX[2], y);
    doc.text(total, colX[3], y);
    y += 5;
  });

  y += 4;
  doc.setFontSize(10);
  doc.text(`Subtotal: $${Number(po.subtotal || 0).toFixed(2)}`, 130, y);
  y += 5;
  doc.text(`Tax: $${Number(po.tax_amount || 0).toFixed(2)}`, 130, y);
  y += 5;
  doc.text(`Shipping: $${Number(po.shipping || 0).toFixed(2)}`, 130, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${Number(po.total || 0).toFixed(2)}`, 130, y);

  if (po.notes) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(po.notes, 180);
    doc.text(lines, margin, y);
  }

  y = 280;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Issued via FleetCo Management — fleetcomanagement.org', margin, y);

  return doc.output('datauristring').split(',')[1];
}

export function downloadPurchaseOrderPdf(po, vendor) {
  const b64 = buildPurchaseOrderPdfBase64(po, vendor);
  const blob = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${po.po_number || 'PO'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
