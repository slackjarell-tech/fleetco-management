import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Edit, Trash2, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import InvoiceModal from '@/components/fleet/InvoiceModal';
import InvoiceDetail from '@/components/fleet/InvoiceDetail';
import { isFleetCoAdmin, filterByCustomerId } from '@/lib/roles';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function Invoices() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      await fetchData(u);
    });
  }, []);

  const fetchData = async (u) => {
    setLoading(true);
    const [inv, vs, us, cs] = await Promise.all([
      api.entities.Invoice.list('-created_date', 200),
      api.entities.Vehicle.list(),
      api.entities.User.list(),
      api.entities.Customer.list(),
    ]);
    const filtered = filterByCustomerId(inv, u);
    setInvoices(filtered);
    setVehicles(vs);
    setUsers(us);
    setCustomers(cs);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.entities.Invoice.delete(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async (data) => {
    if (editInvoice) {
      const updated = await api.entities.Invoice.update(editInvoice.id, data);
      setInvoices(prev => prev.map(i => i.id === editInvoice.id ? updated : i));
    } else {
      const created = await api.entities.Invoice.create(data);
      setInvoices(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditInvoice(null);
  };

  const handleSendNotification = async (inv) => {
    await api.functions.invoke('sendNotification', { type: 'invoice_sent', entityId: inv.id });
    alert(`Email notification sent to customer for Invoice #${inv.invoice_number}`);
  };

  const isAdmin = isFleetCoAdmin(user?.role) || user?.role === 'admin';
  const getCustomerName = (id) => users.find(u => u.id === id)?.full_name || '—';
  const getVehicle = (id) => vehicles.find(v => v.id === id);

  const filtered = invoices.filter(i => {
    const matchSearch = !search || i.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalDue = filtered.filter(i => ['sent','overdue'].includes(i.status)).reduce((s,i) => s + (i.total||0), 0);
  const totalPaid = filtered.filter(i => i.status === 'paid').reduce((s,i) => s + (i.total||0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (viewInvoice) return <InvoiceDetail invoice={viewInvoice} users={users} vehicles={vehicles} onBack={() => setViewInvoice(null)} />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 text-sm">{filtered.length} invoices</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditInvoice(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-xs text-red-600 font-medium mb-1">Total Outstanding</div>
            <div className="text-2xl font-bold text-red-700">${totalDue.toLocaleString('en-US', {minimumFractionDigits:2})}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-xs text-green-600 font-medium mb-1">Total Collected</div>
            <div className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString('en-US', {minimumFractionDigits:2})}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map(inv => {
          const vehicle = getVehicle(inv.vehicle_id);
          return (
            <Card key={inv.id} className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewInvoice(inv)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2.5 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">#{inv.invoice_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{inv.type?.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {isAdmin && <span>{getCustomerName(inv.customer_id)} • </span>}
                        {vehicle && <span>Unit #{vehicle.unit_number} • </span>}
                        {inv.issue_date && <span>Issued {inv.issue_date}</span>}
                        {inv.due_date && <span> • Due {inv.due_date}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">${(inv.total || 0).toFixed(2)}</div>
                      {inv.tax > 0 && <div className="text-xs text-slate-400">incl. ${inv.tax.toFixed(2)} tax</div>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" title="Send email notification" onClick={() => handleSendNotification(inv)}>
                          <Send className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditInvoice(inv); setShowModal(true); }}>
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No invoices found</p>
          </div>
        )}
      </div>

      {showModal && (
        <InvoiceModal
          invoice={editInvoice}
          vehicles={vehicles}
          users={users}
          customers={customers}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditInvoice(null); }}
        />
      )}
    </div>
  );
}