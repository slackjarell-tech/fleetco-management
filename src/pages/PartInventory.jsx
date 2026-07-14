import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Package, AlertTriangle, Search, Plus, Minus, Shield, Edit2, Check, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PartModal from '@/components/inventory/PartModal';

export default function PartInventory() {
  const [user, setUser] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingQty, setEditingQty] = useState(null); // { id, value }
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  const load = async () => {
    const [u, p] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.PartInventory.list('-updated_date', 500),
    ]);
    setUser(u);
    setParts(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = ['all', ...new Set(parts.map(p => p.category).filter(Boolean))];

  const filtered = parts.filter(p => {
    const matchSearch = !search ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.part_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    const isLow = (p.quantity_on_hand || 0) <= (p.reorder_point || 1);
    const matchStatus = filterStatus === 'all' || (filterStatus === 'low' && isLow) || (filterStatus === 'ok' && !isLow);
    return matchSearch && matchCat && matchStatus;
  });

  const lowStockCount = parts.filter(p => (p.quantity_on_hand || 0) <= (p.reorder_point || 1)).length;
  const totalValue = parts.reduce((s, p) => s + ((p.quantity_on_hand || 0) * (p.unit_cost || 0)), 0);

  const adjustQty = async (part, delta) => {
    const newQty = Math.max(0, (part.quantity_on_hand || 0) + delta);
    await api.entities.PartInventory.update(part.id, { quantity_on_hand: newQty });
    setParts(prev => prev.map(p => p.id === part.id ? { ...p, quantity_on_hand: newQty } : p));
  };

  const saveQty = async (part) => {
    const newQty = Math.max(0, parseInt(editingQty.value) || 0);
    await api.entities.PartInventory.update(part.id, { quantity_on_hand: newQty });
    setParts(prev => prev.map(p => p.id === part.id ? { ...p, quantity_on_hand: newQty } : p));
    setEditingQty(null);
  };

  const handleSavePart = async (data) => {
    if (editingPart) {
      await api.entities.PartInventory.update(editingPart.id, data);
    } else {
      await api.entities.PartInventory.create(data);
    }
    setShowModal(false);
    setEditingPart(null);
    load();
  };

  const handleDelete = async (part) => {
    if (!confirm(`Delete "${part.description}"?`)) return;
    await api.entities.PartInventory.delete(part.id);
    setParts(prev => prev.filter(p => p.id !== part.id));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // All authenticated users can access parts inventory

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Parts Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track stock levels and reorder points</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" className="font-bold border-indigo-200 text-indigo-700">
            <Link to="/portal/accounting?tab=purchase-orders">
              <FileText className="w-4 h-4 mr-1" /> Request PO
            </Link>
          </Button>
          <Button onClick={() => { setEditingPart(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4" /> Add Part
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-2xl font-black text-slate-900">{parts.length}</div>
            <div className="text-xs text-slate-500">Total SKUs</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className={`text-2xl font-black ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lowStockCount}</div>
            <div className="text-xs text-slate-500">At / Below Reorder Point</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-2xl font-black text-slate-900">{parts.reduce((s, p) => s + (p.quantity_on_hand || 0), 0)}</div>
            <div className="text-xs text-slate-500">Total Units On Hand</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-2xl font-black text-slate-900">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-slate-500">Inventory Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Search parts..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">All Stock Levels</option>
          <option value="low">⚠ Low / Reorder</option>
          <option value="ok">✓ OK</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Part #</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Location</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase">Qty on Hand</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Reorder At</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Unit Cost</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(part => {
                const qty = part.quantity_on_hand || 0;
                const reorder = part.reorder_point || 1;
                const isLow = qty <= reorder;
                const isEditing = editingQty?.id === part.id;

                return (
                  <tr key={part.id} className={`hover:bg-slate-50 ${isLow ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{part.part_number || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{part.description}</div>
                      {part.supplier && <div className="text-xs text-slate-400">{part.supplier}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{part.category || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{part.location || '—'}</td>

                    {/* Qty Editor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => adjustQty(part, -1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              className="w-14 text-center border border-amber-400 rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 py-0.5"
                              value={editingQty.value}
                              onChange={e => setEditingQty({ id: part.id, value: e.target.value })}
                              onKeyDown={e => { if (e.key === 'Enter') saveQty(part); if (e.key === 'Escape') setEditingQty(null); }}
                              autoFocus
                            />
                            <button onClick={() => saveQty(part)} className="text-emerald-600 hover:text-emerald-800"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingQty(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingQty({ id: part.id, value: qty })}
                            className={`w-12 text-center font-black text-base rounded-md py-0.5 hover:bg-amber-100 transition-colors ${isLow ? 'text-red-600' : 'text-slate-900'}`}
                          >
                            {qty}
                          </button>
                        )}
                        <button
                          onClick={() => adjustQty(part, 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-500 text-sm hidden sm:table-cell">{reorder}</td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">
                      {part.unit_cost ? `$${part.unit_cost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Reorder
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          ✓ OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditingPart(part); setShowModal(true); }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No parts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <PartModal
          part={editingPart}
          onSave={handleSavePart}
          onDelete={editingPart ? () => { handleDelete(editingPart); setShowModal(false); setEditingPart(null); } : null}
          onClose={() => { setShowModal(false); setEditingPart(null); }}
        />
      )}
    </div>
  );
}