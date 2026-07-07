import React from 'react';
import { Edit, Trash2, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PayrollRecordRow({ record, payTypeColors, statusColors, onEdit, onDelete, onStatusChange }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-800 text-sm">{record.driver_name || '—'}</div>
        {record.payment_method && <div className="text-xs text-slate-400">{record.payment_method}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${payTypeColors[record.pay_type] || 'bg-slate-100 text-slate-600'}`}>
          {record.pay_type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
        {record.pay_period_start} → {record.pay_period_end}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-800 text-sm">
        ${(record.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right text-sm text-red-500">
        {record.deductions > 0 ? `-$${(record.deductions || 0).toFixed(2)}` : '—'}
      </td>
      <td className="px-4 py-3 text-right font-black text-amber-600 text-sm">
        ${(record.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3">
        <select
          value={record.status}
          onChange={e => onStatusChange(record.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${statusColors[record.status] || 'bg-slate-100 text-slate-600'}`}
        >
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{record.payment_method || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  );
}