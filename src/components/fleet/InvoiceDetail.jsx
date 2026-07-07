import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, Printer } from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function InvoiceDetail({ invoice, users, vehicles, onBack }) {
  const customer = users.find(u => u.id === invoice.customer_id);
  const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden gap-2">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-amber-400 font-bold text-lg tracking-widest">FLEETCO</div>
              <div className="text-slate-400 text-sm">Management LLC</div>
              <div className="text-slate-400 text-sm mt-1">Dallas, TX • support@fleetcomanagement.org</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">INVOICE</div>
              <div className="text-amber-400 text-xl font-bold">#{invoice.invoice_number}</div>
              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[invoice.status]}`}>{invoice.status}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Bill To</div>
              {customer ? (
                <div>
                  <div className="font-bold text-slate-900">{customer.full_name}</div>
                  <div className="text-slate-500 text-sm">{customer.email}</div>
                </div>
              ) : <div className="text-slate-400 text-sm">—</div>}
              {vehicle && (
                <div className="mt-2 text-sm text-slate-600">
                  Vehicle: Unit #{vehicle.unit_number} — {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Details</div>
              {invoice.issue_date && <div className="text-sm text-slate-600">Issued: <span className="font-medium text-slate-800">{invoice.issue_date}</span></div>}
              {invoice.due_date && <div className="text-sm text-slate-600">Due: <span className="font-medium text-slate-800">{invoice.due_date}</span></div>}
              <div className="text-sm text-slate-600">Type: <span className="font-medium text-slate-800 capitalize">{invoice.type?.replace(/_/g,' ')}</span></div>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items || []).map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-800">{item.description}</td>
                  <td className="py-3 text-center"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">{item.type}</span></td>
                  <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-600">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-slate-800">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span>${(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span><span>${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-xl pt-2 border-t-2 border-slate-900">
                <span>Total</span><span>${(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Notes</div>
              <p className="text-slate-600 text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}