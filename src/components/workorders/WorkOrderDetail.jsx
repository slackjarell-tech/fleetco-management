import React, { useState } from 'react';
import { X, Printer, Wrench, Truck, User, Calendar, Package, Phone, Mail } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/workOrderWorkflow';
import RepairOrderPhaseBar from '@/components/workorders/RepairOrderPhaseBar';
import SignaturePad from '@/components/ui/SignaturePad';
import WorkOrderCommentPanel, { WorkOrderCommentsList } from '@/components/workorders/WorkOrderCommentPanel';

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

function CustomerAuthorizationPanel({ wo, onCustomerAuthorize }) {
  const [method, setMethod] = useState('signature');
  const [signature, setSignature] = useState(wo.customer_signature || '');
  const [signerName, setSignerName] = useState(wo.customer_name || '');
  const [verbalNote, setVerbalNote] = useState('');

  const canSubmit = method === 'signature' ? !!signature && signerName.trim() : verbalNote.trim() && signerName.trim();

  return (
    <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
      <div className="text-sm font-bold text-indigo-900">Customer authorization — required before repair</div>
      <p className="text-xs text-indigo-800/80">
        Document approval of the estimate (signature, or phone/text/email on record).
      </p>
      <div className="flex flex-wrap gap-2">
        {['signature', 'phone', 'email', 'text'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold capitalize ${
              method === m ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-200 text-indigo-800'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <input
        value={signerName}
        onChange={(e) => setSignerName(e.target.value)}
        placeholder="Customer name (printed)"
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm"
      />
      {method === 'signature' ? (
        <SignaturePad
          label="Customer signature"
          existingSignature={signature || null}
          onSignatureChange={setSignature}
          signerName={signerName}
          required
        />
      ) : (
        <textarea
          value={verbalNote}
          onChange={(e) => setVerbalNote(e.target.value)}
          rows={3}
          placeholder={`Record ${method} approval: date, time, who approved…`}
          className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm resize-none"
        />
      )}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onCustomerAuthorize(wo, {
          customer_signature: method === 'signature' ? signature : '',
          authorization_method: method,
          authorized_by_name: signerName.trim(),
          authorization_notes: method === 'signature' ? '' : verbalNote.trim(),
        })}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
      >
        Record authorization & release to shop
      </button>
    </div>
  );
}

export default function WorkOrderDetail({
  wo, vehicles, users, onClose, onEdit, onApprove, onReject, onCustomerAuthorize, showEditButton = true,
  canAddComment = false, onAddComment,
}) {
  const vehicle = vehicles.find(v => v.id === wo.vehicle_id);
  const tech = users.find(u => u.id === wo.assigned_tech_id);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl print:rounded-none print:bg-white print:border-slate-300">
          <div>
            <h2 className="text-white print:text-slate-900 font-black text-xl">{wo.wo_number}</h2>
            <p className="text-slate-400 print:text-slate-600 text-sm mt-0.5">{wo.title}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-1 text-slate-300 hover:text-white text-sm px-3 py-1.5 border border-slate-600 rounded-lg">
              <Printer className="w-4 h-4" /> Print
            </button>
            {onApprove && (
              <>
                <button type="button" onClick={() => onReject(wo)} className="text-sm px-3 py-1.5 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50">
                  Request revision
                </button>
                <button type="button" onClick={() => onApprove(wo)} className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold">
                  Approve estimate
                </button>
              </>
            )}
            {showEditButton && onEdit && (
              <button type="button" onClick={() => onEdit(wo)} className="flex items-center gap-1 text-slate-900 bg-amber-500 hover:bg-amber-400 text-sm px-3 py-1.5 rounded-lg font-semibold">
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <RepairOrderPhaseBar wo={wo} />

          {canAddComment && onAddComment && (
            <WorkOrderCommentPanel onSubmit={(text) => onAddComment(wo, text)} />
          )}

          <WorkOrderCommentsList comments={wo.work_order_comments} />

          {onCustomerAuthorize && (
            <CustomerAuthorizationPanel wo={wo} onCustomerAuthorize={onCustomerAuthorize} />
          )}

          {/* Status row */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[wo.status] || 'bg-slate-100 text-slate-600'}`}>
              {STATUS_LABELS[wo.status] || wo.status?.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${PRIORITY_COLORS[wo.priority]}`}>
              {wo.priority} priority
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{wo.repair_type}</span>
            {wo.warranty_repair && <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Warranty</span>}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {vehicle && (
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Vehicle</div>
                  <div className="text-sm font-semibold text-slate-900">#{vehicle.unit_number}</div>
                  <div className="text-xs text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                </div>
              </div>
            )}
            {tech && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Assigned Tech</div>
                  <div className="text-sm font-semibold text-slate-900">{tech.full_name}</div>
                </div>
              </div>
            )}
            {wo.odometer && (
              <div className="flex items-start gap-2">
                <Wrench className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Odometer</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.odometer?.toLocaleString()} mi</div>
                </div>
              </div>
            )}
            {wo.opened_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Opened</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.opened_date}</div>
                </div>
              </div>
            )}
            {wo.due_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Due Date</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.due_date}</div>
                </div>
              </div>
            )}
          </div>

          {(wo.customer_name || wo.customer_phone || wo.customer_email) && (
            <div className="grid sm:grid-cols-3 gap-3 text-sm border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div>
                <div className="text-xs text-slate-500">Customer</div>
                <div className="font-semibold">{wo.customer_name || '—'}</div>
              </div>
              {wo.customer_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {wo.customer_phone}
                </div>
              )}
              {wo.customer_email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {wo.customer_email}
                </div>
              )}
            </div>
          )}

          {(wo.fuel_level || wo.dash_warnings || wo.body_damage_notes || wo.check_in_notes) && (
            <div className="text-sm border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold uppercase text-slate-500">Check-in condition</div>
              {wo.fuel_level && <p><span className="text-slate-500">Fuel:</span> {wo.fuel_level}</p>}
              {wo.dash_warnings && <p><span className="text-slate-500">Dash:</span> {wo.dash_warnings}</p>}
              {wo.body_damage_notes && <p><span className="text-slate-500">Body:</span> {wo.body_damage_notes}</p>}
              {wo.check_in_notes && <p><span className="text-slate-500">Notes:</span> {wo.check_in_notes}</p>}
            </div>
          )}

          {wo.authorized_at && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              Customer authorized {wo.authorized_at.slice(0, 10)}
              {wo.authorized_by_name ? ` — ${wo.authorized_by_name}` : ''}
              {wo.authorization_method ? ` (${wo.authorization_method})` : ''}
            </div>
          )}

          {/* C/D/R */}
          {(wo.mechanic_notes_log?.length > 0) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-600 uppercase mb-2">Mechanic notes</div>
              <ul className="space-y-2 text-sm text-slate-700">
                {wo.mechanic_notes_log.map((n, i) => (
                  <li key={i}>
                    <span className="text-slate-400 text-xs">{n.at?.slice(0, 16).replace('T', ' ')} · {n.by}</span>
                    <p className="mt-0.5">{n.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(wo.complaint || wo.diagnosis || wo.repair_notes) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {wo.complaint && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-red-600 uppercase mb-1">Complaint</div>
                  <p className="text-sm text-slate-700">{wo.complaint}</p>
                </div>
              )}
              {wo.diagnosis && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-600 uppercase mb-1">Diagnosis</div>
                  <p className="text-sm text-slate-700">{wo.diagnosis}</p>
                </div>
              )}
              {wo.repair_notes && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-green-600 uppercase mb-1">Work Performed</div>
                  <p className="text-sm text-slate-700">{wo.repair_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Parts Table */}
          {wo.parts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-slate-900">Parts Used</h3>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Part #</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Description</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-600">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600">Unit</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-600">Source</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wo.parts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.part_number}</td>
                        <td className="px-4 py-2 text-slate-700">{p.description}</td>
                        <td className="px-4 py-2 text-center">{p.quantity}</td>
                        <td className="px-4 py-2 text-right">${(p.unit_cost || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            p.source === 'warranty' ? 'bg-green-100 text-green-600' :
                            p.source === 'ordered' ? 'bg-purple-100 text-purple-600' :
                            p.source === 'requested' ? 'bg-cyan-100 text-cyan-700' :
                            'bg-slate-100 text-slate-600'}`}>
                            {p.source === 'requested' ? 'requested' : p.source?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">${(p.total_cost || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(wo.estimate_submitted_at || wo.approved_at) && (
            <div className="text-xs text-slate-500 space-y-1 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {wo.estimate_submitted_at && (
                <p>Estimate submitted {wo.estimate_submitted_at.slice(0, 10)} {wo.estimate_submitted_by ? `by ${wo.estimate_submitted_by}` : ''}</p>
              )}
              {wo.approved_at && (
                <p className="text-emerald-700">Approved {wo.approved_at.slice(0, 10)} {wo.approved_by ? `by ${wo.approved_by}` : ''}</p>
              )}
              {wo.rejection_notes && (
                <p className="text-red-600">Revision requested: {wo.rejection_notes}</p>
              )}
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-slate-900 rounded-xl p-5 text-white">
            <h3 className="font-black mb-4 text-amber-400">{wo.status === 'awaiting_approval' ? 'Estimate total' : 'Cost Summary'}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Parts</span><span>${(wo.parts_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Labor ({wo.labor_hours}h @ ${wo.labor_rate}/hr)</span>
                <span>${(wo.labor_cost || 0).toFixed(2)}</span>
              </div>
              {(wo.tax_percent > 0 || wo.tax_amount > 0) && (
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({wo.tax_percent || 0}%)</span>
                  <span>${(wo.tax_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 flex justify-between font-black text-lg">
                <span>{wo.status === 'completed' ? 'Invoice total' : 'Estimate total'}</span>
                <span className="text-amber-400">${(wo.total_cost || 0).toFixed(2)}</span>
              </div>
              {wo.status === 'completed' && (
                <p className="text-xs text-slate-400 pt-1">Payment: {wo.payment_status || 'pending'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}