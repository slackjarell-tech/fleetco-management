import { jsPDF } from 'jspdf';

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function formatTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ts; }
}

function statusLabel(s) {
  return (s || 'pending').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function addPageHeader(doc, pageWidth) {
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, 4, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FLEETCO MANAGEMENT LLC', 12, 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text('Driver Vehicle Inspection Reports (DVIR) — 49 CFR §396.11', 12, 17);
  doc.setTextColor(50, 50, 50);
}

function addSectionTitle(doc, text, y, pageWidth) {
  doc.setFillColor(245, 158, 11);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(text, 18, y + 5.5);
  return y + 12;
}

function addRow(doc, label, value, x, y, colW) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 120);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(String(value || '—'), x + colW, y);
}

function drawChecklist(doc, items, y, pageWidth, margin) {
  if (!items || items.length === 0) return y;
  const colW = (pageWidth - margin * 2) / 3;
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  Object.entries(grouped).forEach(([cat, catItems]) => {
    if (y > 255) {
      doc.addPage();
      addPageHeader(doc, pageWidth);
      y = 30;
    }
    doc.setFillColor(240, 240, 245);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 100);
    doc.text(cat.toUpperCase(), margin + 2, y + 4.2);
    y += 8;

    catItems.forEach((item, i) => {
      if (y > 262) {
        doc.addPage();
        addPageHeader(doc, pageWidth);
        y = 30;
      }
      const col = i % 3;
      const xPos = margin + col * colW;
      const result = item.result || 'ok';
      const dotColor = result === 'ok' ? [16, 185, 129] : result === 'defect' ? [239, 68, 68] : [160, 160, 160];
      doc.setFillColor(...dotColor);
      doc.circle(xPos + 2.5, y + 1.5, 1.5, 'F');
      doc.setFont('helvetica', result === 'defect' ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(result === 'defect' ? 180 : 50, 30, 30);
      doc.text(item.item || '', xPos + 6, y + 2.5);
      if (result === 'defect' && item.notes) {
        doc.setTextColor(200, 50, 50);
        doc.setFontSize(5.5);
        doc.text(`↳ ${item.notes}`, xPos + 6, y + 5.5);
      }
      if (col === 2 || i === catItems.length - 1) y += result === 'defect' && item.notes ? 10 : 7;
    });
    y += 2;
  });
  return y;
}

export async function exportDVIRPdf(inspections, vehicleMap) {
  const dvirs = inspections.filter(i =>
    i.inspection_type === 'Pre-Trip' || i.inspection_type === 'Post-Trip'
  );

  if (dvirs.length === 0) {
    alert('No Pre-Trip or Post-Trip inspections found to export.');
    return;
  }

  // Group by vehicle then by date
  const byVehicle = {};
  dvirs.forEach(d => {
    const vId = d.vehicle_id || 'unknown';
    if (!byVehicle[vId]) byVehicle[vId] = [];
    byVehicle[vId].push(d);
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let firstPage = true;

  Object.entries(byVehicle).forEach(([vId, records]) => {
    const veh = vehicleMap[vId];
    const unitNum = veh?.unit_number || vId;

    // Sort: Pre-Trip first, then Post-Trip, within same date
    records.sort((a, b) => {
      const dateSort = (a.inspection_date || '').localeCompare(b.inspection_date || '');
      if (dateSort !== 0) return dateSort;
      const typeOrder = { 'Pre-Trip': 0, 'Post-Trip': 1 };
      return (typeOrder[a.inspection_type] ?? 2) - (typeOrder[b.inspection_type] ?? 2);
    });

    if (!firstPage) doc.addPage();
    firstPage = false;

    addPageHeader(doc, pageWidth);
    let y = 28;

    // Vehicle header block
    doc.setFillColor(248, 248, 252);
    doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
    doc.setDrawColor(200, 200, 220);
    doc.rect(margin, y, pageWidth - margin * 2, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(`Unit #${unitNum}`, margin + 4, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 120);
    doc.text(`${veh?.year || ''} ${veh?.make || ''} ${veh?.model || ''}`.trim(), margin + 4, y + 15);
    doc.text(`VIN: ${veh?.vin || '—'}`, margin + 4, y + 20);
    doc.text(`Records: ${records.length}   |   Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 4, y + 9, { align: 'right' });
    y += 28;

    records.forEach((ins, idx) => {
      if (y > 240 && idx > 0) {
        doc.addPage();
        addPageHeader(doc, pageWidth);
        y = 30;
      }

      const typeColor = ins.inspection_type === 'Pre-Trip' ? [16, 185, 129] : [99, 102, 241];
      doc.setFillColor(...typeColor);
      doc.roundedRect(margin, y, 22, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(ins.inspection_type || '', margin + 11, y + 4.8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(`${formatDate(ins.inspection_date)} — ${ins.inspection_type} Inspection`, margin + 26, y + 5);

      const statusC = ins.status === 'passed' ? [16, 185, 129] : ins.status === 'failed' ? [239, 68, 68] : [245, 158, 11];
      doc.setFillColor(...statusC);
      const statusText = statusLabel(ins.status);
      doc.roundedRect(pageWidth - margin - 24, y, 24, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(statusText, pageWidth - margin - 12, y + 4.8, { align: 'center' });
      y += 11;

      // Info rows
      const colW = 18;
      const half = (pageWidth - margin * 2) / 2;
      doc.setFontSize(7.5);

      addRow(doc, 'Driver:', ins.inspector_name, margin, y, colW);
      addRow(doc, 'Carrier:', ins.carrier_name, margin + half, y, colW);
      y += 6;
      addRow(doc, 'Odometer:', ins.odometer ? ins.odometer.toLocaleString() + ' mi' : '—', margin, y, colW);
      addRow(doc, 'Trailer #:', ins.trailer_number, margin + half, y, colW);
      y += 6;

      if (ins.defects_found) {
        doc.setFillColor(254, 226, 226);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`⚠  Defects Found${ins.defects_corrected ? ' — CORRECTED before departure' : ' — MANAGER SIGN-OFF REQUIRED'}`, margin + 3, y + 4.2);
        y += 8;
      } else {
        doc.setFillColor(220, 252, 231);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(21, 128, 61);
        doc.text('✓  No defects found — Vehicle in satisfactory condition', margin + 3, y + 4.2);
        y += 8;
      }

      // Checklist
      y = addSectionTitle(doc, 'VEHICLE INSPECTION CHECKLIST', y, pageWidth);
      y = drawChecklist(doc, ins.items_checked, y, pageWidth, margin);

      // Signatures
      if (ins.driver_signed_at || ins.manager_signed_at || ins.notes) {
        if (y > 240) { doc.addPage(); addPageHeader(doc, pageWidth); y = 30; }
        y = addSectionTitle(doc, 'CERTIFICATIONS & SIGNATURES', y, pageWidth);

        if (ins.driver_signed_at) {
          const driverLine = `${ins.inspector_name || '—'}${ins.driver_employee_number ? ' · EMP# ' + ins.driver_employee_number : ''} at ${formatTs(ins.driver_signed_at)}`;
          addRow(doc, 'Driver Signed:', driverLine, margin, y, 24);
          y += 6;
        }
        if (ins.manager_signed_at) {
          const mgrLine = `${ins.manager_name || '—'}${ins.manager_employee_number ? ' · EMP# ' + ins.manager_employee_number : ''} at ${formatTs(ins.manager_signed_at)}`;
          addRow(doc, 'Mgr Sign-Off:', mgrLine, margin, y, 24);
          y += 6;
        }
        if (ins.manager_notes) {
          addRow(doc, 'Mgr Notes:', ins.manager_notes, margin, y, 24);
          y += 6;
        }
        if (ins.notes) {
          addRow(doc, 'Remarks:', ins.notes, margin, y, 24);
          y += 6;
        }
      }

      y += 8;
      doc.setDrawColor(220, 220, 235);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);
    });
  });

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 180);
    doc.text(`Page ${p} of ${totalPages} — FleetCo Management LLC — DVIR Records`, pageWidth / 2, 276, { align: 'center' });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`FleetCo_DVIR_Report_${dateStr}.pdf`);
}