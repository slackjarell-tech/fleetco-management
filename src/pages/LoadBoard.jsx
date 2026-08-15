import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Edit, Trash2, MapPin, Calendar, Package, Bell, Navigation, Scale, FileText, Handshake, Check, X, DollarSign, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import LoadModal from '@/components/fleet/LoadModal';
import WeightScaleModal from '@/components/loadboard/WeightScaleModal';
import { isFleetCoAdmin, filterByCustomerId } from '@/lib/roles';
import { isPureDriverUser, isDriverCapableUser } from '@/lib/driverAccess';
import {
  canPostLoad, canDispatchLoad, isCustomerLoadPoster, canBrowseMarketplace,
  canBookMarketplaceLoad, canRespondToBooking, canAccessLoadThread,
  userLoadFeeAmount, userLoadFeePercent,
} from '@/lib/loadBoardAccess';
import LoadThreadPanel from '@/components/loadboard/LoadThreadPanel';
import LoadBoardFeeGate from '@/components/loadboard/LoadBoardFeeGate';
import { downloadRateConfirmationPdf } from '@/lib/accounting/rateConfirmationPdf';
import { equipmentLabel } from '@/lib/equipmentTypes';
import { canDownloadBol, hasBol, bolFileUrl, bolDownloadFilename } from '@/lib/loadBol';

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
};

export default function LoadBoard() {
  const [user, setUser] = useState(null);
  const [loads, setLoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editLoad, setEditLoad] = useState(null);
  const [scaleLoad, setScaleLoad] = useState(null);
  const [boardTab, setBoardTab] = useState('my');
  const [marketplaceLoads, setMarketplaceLoads] = useState([]);
  const [threadLoad, setThreadLoad] = useState(null);
  const [feeAcknowledged, setFeeAcknowledged] = useState(null);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      if (u && !isFleetCoAdmin(u.role) && (canPostLoad(u) || canBrowseMarketplace(u))) {
        try {
          const res = await api.functions.invoke('getLoadBoardFeeAcknowledgment', {});
          setFeeAcknowledged(!!res.acknowledged);
        } catch {
          setFeeAcknowledged(false);
        }
      } else {
        setFeeAcknowledged(true);
      }
      await fetchData(u);
    });
  }, []);

  const fetchData = async (u) => {
    setLoading(true);
    const [ls, vs, us, cs] = await Promise.all([
      api.entities.Load.list('-created_date', 200),
      api.entities.Vehicle.list(),
      api.entities.User.list(),
      api.entities.Customer.list(),
    ]);
    let filtered = ls;
    if (isPureDriverUser(u)) {
      filtered = ls.filter((l) => l.assigned_driver_id === u.id);
    } else {
      filtered = filterByCustomerId(ls, u);
    }
    setLoads(filtered);
    setVehicles(vs);
    setUsers(us);
    setCustomers(cs);
    if (canBrowseMarketplace(u)) {
      try {
        const res = await api.functions.invoke('listMarketplaceLoads', {});
        setMarketplaceLoads(res.loads || []);
      } catch {
        setMarketplaceLoads([]);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this load?')) return;
    await api.entities.Load.delete(id);
    setLoads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = async (data) => {
    const payload = { ...data, customer_id: data.customer_id || user?.customer_id || null };
    if (editLoad) {
      const updated = await api.entities.Load.update(editLoad.id, payload);
      setLoads((prev) => prev.map((l) => (l.id === editLoad.id ? updated : l)));
    } else {
      const created = await api.entities.Load.create({
        ...payload,
        marketplace_visible: payload.marketplace_visible !== false,
        booking_status: payload.booking_status || 'open',
      });
      setLoads((prev) => [created, ...prev]);
    }
    setShowModal(false);
    setEditLoad(null);
    fetchData(user);
  };

  const handleNotifyDriver = async (load) => {
    await api.functions.invoke('sendNotification', { type: 'load_assigned', entityId: load.id });
    alert(`Email notification sent to driver for Load #${load.load_number}`);
  };

  const handleBookLoad = async (load) => {
    if (!confirm(`Book load #${load.load_number} for your fleet?`)) return;
    await api.functions.invoke('bookLoad', { loadId: load.id });
    await fetchData(user);
    alert('Booking request sent — waiting for load poster to accept.');
  };

  const handleBookingResponse = async (load, action) => {
    await api.functions.invoke('respondToLoadBooking', { loadId: load.id, action });
    await fetchData(user);
  };

  const handleCompleteWithFee = async (load) => {
    const res = await api.functions.invoke('completeLoadWithFee', { loadId: load.id });
    await fetchData(user);
    alert(`Load delivered. Your platform fee: $${(res.financials?.poster_fee_amount || res.financials?.carrier_fee_amount || res.platformFee)?.toFixed(2) || '0'}`);
  };

  const handlePayPlatformFee = async (load) => {
    const res = await api.functions.invoke('createLoadPlatformFeeCheckout', { loadId: load.id });
    if (res.url) window.location.href = res.url;
    else alert(res.message || 'Fee recorded as pending.');
    await fetchData(user);
  };

  const isAdmin = isFleetCoAdmin(user?.role) || user?.role === 'admin';
  const canPost = canPostLoad(user);
  const canDispatch = canDispatchLoad(user);
  const customerPoster = isCustomerLoadPoster(user);
  const canWeigh = isAdmin || isDriverCapableUser(user);
  const canMarketplace = canBrowseMarketplace(user);

  const SCALE_STATUS_STYLE = {
    pass: 'bg-green-100 text-green-700',
    overweight: 'bg-red-100 text-red-700 animate-pulse',
    reweigh_needed: 'bg-amber-100 text-amber-700',
    not_weighed: 'bg-slate-100 text-slate-500',
  };

  const filtered = loads.filter((l) => {
    const matchSearch = !search || l.load_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.origin?.toLowerCase().includes(search.toLowerCase()) ||
      l.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchEquipment = equipmentFilter === 'all' || l.required_equipment_type === equipmentFilter;
    return matchSearch && matchStatus && matchEquipment;
  });

  const filteredMarketplace = marketplaceLoads.filter((l) => {
    const matchSearch = !search || l.load_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.origin?.toLowerCase().includes(search.toLowerCase()) ||
      l.destination?.toLowerCase().includes(search.toLowerCase());
    const matchEquipment = equipmentFilter === 'all' || l.required_equipment_type === equipmentFilter;
    return matchSearch && matchEquipment;
  });

  const displayLoads = boardTab === 'find' ? filteredMarketplace : filtered;
  const getDriverName = (id) => users.find((u) => u.id === id)?.full_name || '—';
  const getVehicle = (id) => vehicles.find((v) => v.id === id)?.unit_number || '—';

  const renderLoadCard = (load, { marketplace = false } = {}) => (
    <Card key={load.id} className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-bold text-slate-900 text-lg">#{load.load_number}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[load.status] || STATUS_COLORS.available}`}>
                {load.status?.replace('_', ' ')}
              </span>
              {load.booking_status === 'pending' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Booking pending</span>
              )}
              {load.required_equipment_type && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                  {equipmentLabel(load.required_equipment_type)}
                </span>
              )}
              {hasBol(load) && (
                <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" /> BOL
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />{load.origin} → {load.destination}
              </span>
              {load.pickup_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />Pickup: {load.pickup_date}</span>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
              {load.miles && <span>{load.miles} mi</span>}
              {load.weight && <span>{load.weight}</span>}
              {!marketplace && canDispatch && load.assigned_driver_id && <span>Driver: {getDriverName(load.assigned_driver_id)}</span>}
              {load.platform_fee_status === 'pending' && user && (() => {
                const feeAmt = userLoadFeeAmount(user, load);
                const feePct = userLoadFeePercent(user, load);
                return feeAmt > 0 && (
                  <span className="text-amber-700 font-medium">Your fee due: ${feeAmt} ({feePct}%)</span>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {load.rate && (
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">${load.rate?.toLocaleString()}</div>
                {load.miles && <div className="text-xs text-slate-400">${(load.rate / load.miles).toFixed(2)}/mi</div>}
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              {marketplace && canBookMarketplaceLoad(user, load) && (
                <Button size="sm" className="bg-amber-500 text-slate-900 font-bold" onClick={() => handleBookLoad(load)}>
                  <Handshake className="w-4 h-4 mr-1" /> Book
                </Button>
              )}
              {!marketplace && load.booking_status === 'pending' && canRespondToBooking(user, load) && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingResponse(load, 'accept')}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBookingResponse(load, 'decline')}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              {canDownloadBol(user, load) && (
                <Button size="icon" variant="ghost" title="Download BOL" asChild>
                  <a href={bolFileUrl(load)} download={bolDownloadFilename(load)} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </a>
                </Button>
              )}
              {canAccessLoadThread(user, load) && (load.booking_status === 'pending' || load.booking_status === 'accepted' || load.booked_by_customer_id) && (
                <Button size="icon" variant="ghost" title="Messages" onClick={() => setThreadLoad(load)}>
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                </Button>
              )}
              {!marketplace && canPost && (
                <Button size="icon" variant="ghost" title="Rate confirmation PDF" onClick={() => downloadRateConfirmationPdf(load)}>
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </Button>
              )}
              {!marketplace && canWeigh && (
                <Button size="icon" variant="ghost" title="Weight scale" onClick={() => setScaleLoad(load)}>
                  <Scale className="w-4 h-4 text-slate-400" />
                </Button>
              )}
              {!marketplace && load.status === 'in_transit' && (canDispatch || canPost) && (
                <Button size="sm" variant="outline" onClick={() => handleCompleteWithFee(load)}>Complete</Button>
              )}
              {!marketplace && load.platform_fee_status === 'pending' && (
                <Button size="sm" variant="outline" onClick={() => handlePayPlatformFee(load)}>Pay fee</Button>
              )}
              {!marketplace && (canDispatch || (canPost && load.customer_id === user?.customer_id)) && (
                <>
                  <Button size="icon" variant="ghost" onClick={() => { setEditLoad(load); setShowModal(true); }}>
                    <Edit className="w-4 h-4 text-slate-500" />
                  </Button>
                  {(canDispatch || (customerPoster && load.status === 'available')) && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(load.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || feeAcknowledged === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (feeAcknowledged === false) {
    return (
      <LoadBoardFeeGate onAcknowledged={() => setFeeAcknowledged(true)} />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Board</h1>
          <p className="text-slate-500 text-sm">
            {boardTab === 'find' ? `${filteredMarketplace.length} open marketplace loads` : `${filtered.length} loads`}
          </p>
        </div>
        {canPost && boardTab === 'my' && (
          <Button onClick={() => { setEditLoad(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" /> {customerPoster ? 'Post Load' : 'New Load'}
          </Button>
        )}
      </div>

      {canMarketplace && (
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setBoardTab('my')} className={`px-4 py-2 rounded-lg text-sm font-bold ${boardTab === 'my' ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
            My Loads
          </button>
          <button type="button" onClick={() => setBoardTab('find')} className={`px-4 py-2 rounded-lg text-sm font-bold ${boardTab === 'find' ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
            Find Loads
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search loads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Equipment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {['dry_van', 'reefer', 'flatbed', 'box_truck', 'power_only', 'cargo_van', 'step_deck', 'hotshot'].map((eq) => (
              <SelectItem key={eq} value={eq}>{equipmentLabel(eq)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {boardTab === 'my' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4">
        {displayLoads.map((load) => renderLoadCard(load, { marketplace: boardTab === 'find' }))}
        {displayLoads.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{boardTab === 'find' ? 'No marketplace loads match your filters' : 'No loads found'}</p>
          </div>
        )}
      </div>

      {scaleLoad && (
        <WeightScaleModal load={scaleLoad} onClose={() => setScaleLoad(null)} onSaved={() => fetchData(user)} />
      )}

      {showModal && (
        <LoadModal
          load={editLoad}
          vehicles={vehicles}
          users={users}
          customers={customers}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditLoad(null); }}
        />
      )}
      {threadLoad && (
        <LoadThreadPanel load={threadLoad} onClose={() => setThreadLoad(null)} />
      )}
    </div>
  );
}
