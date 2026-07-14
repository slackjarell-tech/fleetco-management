import { sendEmail } from './email.js';
import { getEntity } from './db.js';
import { isInternalRole } from './entityScope.js';

function canEmailPO(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  return ['customer_owner', 'customer_hr', 'customer_fleet_manager'].includes(user.role);
}

function poEmailHtml(po, vendor) {
  const lines = (po.line_items || []).map(l => `
    <tr>
      <td style="padding:6px;border-bottom:1px solid #eee">${l.part_number || ''} ${l.description || ''}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:right">${l.quantity}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:right">$${Number(l.unit_cost || 0).toFixed(2)}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:right">$${Number(l.total || l.quantity * l.unit_cost || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:sans-serif;max-width:640px;color:#1e293b">
      <h2 style="color:#0f172a">Purchase Order ${po.po_number || ''}</h2>
      <p>Please confirm receipt of this purchase order. A PDF copy is attached.</p>
      <p><strong>Vendor:</strong> ${vendor?.name || po.vendor_name || '—'}<br/>
      <strong>Needed by:</strong> ${po.needed_by || 'ASAP'}<br/>
      <strong>Total:</strong> $${Number(po.total || 0).toFixed(2)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px;text-align:right">Qty</th>
          <th style="padding:8px;text-align:right">Unit</th>
          <th style="padding:8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${lines}</tbody>
      </table>
      ${po.notes ? `<p style="margin-top:16px"><strong>Notes:</strong> ${po.notes}</p>` : ''}
      <p style="margin-top:24px;font-size:12px;color:#64748b">Sent via FleetCo Management</p>
    </div>
  `;
}

export async function emailPurchaseOrder({ poId, pdfBase64, recipientEmail, user }) {
  if (!canEmailPO(user)) {
    const err = new Error('Not authorized to email purchase orders');
    err.status = 403;
    throw err;
  }

  const po = getEntity('PurchaseOrder', poId);
  if (!po) {
    const err = new Error('Purchase order not found');
    err.status = 404;
    throw err;
  }

  const vendor = po.vendor_id ? getEntity('Vendor', po.vendor_id) : null;
  const to = recipientEmail || vendor?.email;
  if (!to) {
    const err = new Error('No vendor email — add email on the vendor record or pass recipientEmail');
    err.status = 400;
    throw err;
  }

  const attachments = pdfBase64 ? [{
    filename: `${po.po_number || 'PO'}.pdf`,
    content: pdfBase64,
  }] : [];

  const result = await sendEmail({
    to,
    subject: `Purchase Order ${po.po_number} — ${vendor?.name || po.vendor_name || 'FleetCo'}`,
    html: poEmailHtml(po, vendor),
    text: `Purchase Order ${po.po_number}. Total: $${Number(po.total || 0).toFixed(2)}. See attached PDF.`,
    attachments,
    replyTo: user?.email || undefined,
  });

  return { ...result, sentTo: to };
}
