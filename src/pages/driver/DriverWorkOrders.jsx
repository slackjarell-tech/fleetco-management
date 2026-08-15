import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Wrench, Camera, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CameraCapture from '@/components/driver/CameraCapture';

const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  awaiting_approval: 'Awaiting review',
  completed: 'Completed',
};

export default function DriverWorkOrders() {
  const { user } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitWo, setSubmitWo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [wos, vehs] = await Promise.all([
        api.entities.WorkOrder.list('-created_date', 200),
        api.entities.Vehicle.list(),
      ]);
      const mine = wos.filter(
        (wo) => wo.driver_id === user.id
          || wo.submitted_by_driver_id === user.id
          || ['open', 'in_progress', 'awaiting_approval'].includes(wo.status)
      );
      setOrders(mine.slice(0, 50));
      setVehicles(vehs);
      setLoading(false);
    })();
  }, [user?.id]);

  const vehLabel = (id) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `#${v.unit_number}` : '—';
  };

  const openSubmit = (wo) => {
    setSubmitWo(wo);
    setPhotos(wo.driver_photos || []);
    setInvoiceUrl(wo.shop_invoice_url || '');
    setNotes(wo.driver_submission_notes || '');
  };

  const handleSubmit = async () => {
    if (!submitWo) return;
    setSaving(true);
    await api.entities.WorkOrder.update(submitWo.id, {
      driver_photos: photos,
      shop_invoice_url: invoiceUrl || undefined,
      driver_submission_notes: notes || undefined,
      submitted_by_driver_id: user.id,
      submitted_at: new Date().toISOString(),
      status: submitWo.status === 'completed' ? 'completed' : 'awaiting_approval',
    });
    setOrders((prev) => prev.map((o) => (o.id === submitWo.id ? { ...o, status: 'awaiting_approval' } : o)));
    setSubmitWo(null);
    setSaving(false);
  };

  const createShopRequest = async () => {
    setSaving(true);
    const n = orders.length + 1;
    const created = await api.entities.WorkOrder.create({
      wo_number: `DRV-${Date.now().toString(36).toUpperCase()}`,
      title: 'Driver shop report',
      repair_type: 'Other',
      status: 'awaiting_approval',
      priority: 'medium',
      complaint: notes || 'Driver submitted repair photos for review',
      driver_id: user.id,
      submitted_by_driver_id: user.id,
      driver_photos: photos,
      shop_invoice_url: invoiceUrl || undefined,
      driver_submission_notes: notes,
      submitted_at: new Date().toISOString(),
      shop_name: 'Field submission',
    });
    setOrders((prev) => [created, ...prev]);
    setSubmitWo(null);
    setPhotos([]);
    setNotes('');
    setInvoiceUrl('');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" /> Shop & Repairs
          </h1>
          <p className="text-xs text-slate-500">Photo damage or shop invoices for manager approval</p>
        </div>
        <Button size="sm" className="bg-amber-500 text-slate-900 font-bold" onClick={() => { setSubmitWo({ id: null }); setPhotos([]); setNotes(''); setInvoiceUrl(''); }}>
          <Camera className="w-4 h-4 mr-1" /> New report
        </Button>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">No open work orders. Tap New report to send shop photos.</div>
      )}

      {orders.map((wo) => (
        <div key={wo.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex justify-between gap-2">
            <div>
              <div className="font-bold text-slate-900">{wo.wo_number} — {wo.title}</div>
              <div className="text-xs text-slate-500">{vehLabel(wo.vehicle_id)} · {wo.shop_name || 'Shop TBD'}</div>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600 h-fit">
              {STATUS_LABEL[wo.status] || wo.status}
            </span>
          </div>
          {wo.complaint && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{wo.complaint}</p>}
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => openSubmit(wo)}>
            <Camera className="w-3.5 h-3.5 mr-1" /> Add photos / invoice
          </Button>
        </div>
      ))}

      {submitWo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black">{submitWo.id ? 'Update work order' : 'New shop report'}</h2>
              <button type="button" onClick={() => setSubmitWo(null)}><X className="w-5 h-5" /></button>
            </div>
            <CameraCapture label="Damage / repair photos" onCapture={(url) => setPhotos((p) => [...p, url])} />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <img key={url} src={url} alt="" className="rounded-lg h-20 w-full object-cover border" />
                ))}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-500">Shop invoice photo</label>
              <CameraCapture label="Invoice" onCapture={setInvoiceUrl} />
              {invoiceUrl && <img src={invoiceUrl} alt="Invoice" className="mt-2 rounded-lg max-h-32 object-cover border" />}
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue or shop work..." className="w-full border rounded-xl p-3 text-sm min-h-[80px]" />
            <Button disabled={saving || photos.length === 0} className="w-full bg-amber-500 font-bold text-slate-900" onClick={submitWo.id ? handleSubmit : createShopRequest}>
              <Send className="w-4 h-4 mr-1" /> Submit for manager review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
