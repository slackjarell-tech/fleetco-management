import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { ChevronLeft, ChevronRight, Wrench, Calendar, Truck, AlertTriangle, Shield } from 'lucide-react';
import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfMonth, endOfWeek, format, isSameDay, isToday, parseISO, isSameMonth } from 'date-fns';

const STATUS_COLOR = {
  open:        { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  parts_ordered:{ bg: 'bg-purple-100',text: 'text-purple-800', dot: 'bg-purple-500' },
  awaiting_parts:{ bg:'bg-purple-100',text: 'text-purple-800', dot: 'bg-purple-500' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  cancelled:   { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400' },
  scheduled:   { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  upcoming:    { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  overdue:     { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
};

function EventPill({ event, onClick }) {
  const c = STATUS_COLOR[event.status] || STATUS_COLOR.scheduled;
  return (
    <button
      onClick={() => onClick(event)}
      className={`w-full text-left text-xs px-2 py-1 rounded-md mb-0.5 flex items-center gap-1.5 truncate font-semibold hover:opacity-80 transition-opacity ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      <span className="truncate">{event.vehicle_label} — {event.title}</span>
    </button>
  );
}

function DayCell({ date, events, currentMonth, onClick, onEventClick }) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const todayClass = isToday(date) ? 'bg-amber-500 text-white font-black rounded-full w-7 h-7 flex items-center justify-center' : '';
  const MAX_VISIBLE = 3;
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;

  return (
    <div
      className={`min-h-[100px] p-1.5 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}`}
      onClick={() => onClick(date)}
    >
      <div className={`text-xs mb-1 w-7 h-7 flex items-center justify-center ${todayClass} ${!isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`}>
        {format(date, 'd')}
      </div>
      <div>
        {visible.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
        {overflow > 0 && (
          <button onClick={(ev) => { ev.stopPropagation(); onClick(date); }} className="text-xs text-slate-400 hover:text-amber-600 px-2 font-medium">
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

function WeekView({ weekStart, events, onEventClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm

  const getEventsForDay = (day) => events.filter(e => e.date && isSameDay(parseISO(e.date), day));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {days.map(day => (
            <div key={day.toISOString()} className={`px-2 py-3 text-center border-r border-slate-200 last:border-r-0 ${isToday(day) ? 'bg-amber-50' : ''}`}>
              <div className="text-xs font-bold text-slate-500 uppercase">{format(day, 'EEE')}</div>
              <div className={`text-lg font-black mt-0.5 ${isToday(day) ? 'text-amber-600' : 'text-slate-800'}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        {/* All-day events */}
        <div className="grid grid-cols-7 border-b border-slate-200 min-h-[60px] bg-white">
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toISOString()} className={`p-1 border-r border-slate-200 last:border-r-0 ${isToday(day) ? 'bg-amber-50/30' : ''}`}>
                {dayEvents.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
                {dayEvents.length === 0 && <div className="text-xs text-slate-300 text-center py-2">—</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;
  const c = STATUS_COLOR[event.status] || STATUS_COLOR.scheduled;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${c.bg}`}>
            {event.source === 'workorder' ? <Wrench className={`w-5 h-5 ${c.text}`} /> : <Calendar className={`w-5 h-5 ${c.text}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-slate-900 text-base">{event.title}</div>
            <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
              <Truck className="w-3.5 h-3.5" /> {event.vehicle_label}
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${c.bg} ${c.text}`}>
            {event.status?.replace('_', ' ')}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-slate-500 w-24 flex-shrink-0">Date:</span>
            <span className="font-semibold text-slate-800">{event.date ? format(parseISO(event.date), 'MMMM d, yyyy') : '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 w-24 flex-shrink-0">Type:</span>
            <span className="font-semibold text-slate-800">{event.source === 'workorder' ? 'Work Order' : 'Preventive Maintenance'}</span>
          </div>
          {event.priority && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-24 flex-shrink-0">Priority:</span>
              <span className={`font-semibold capitalize ${event.priority === 'critical' ? 'text-red-600' : event.priority === 'high' ? 'text-orange-600' : 'text-slate-800'}`}>{event.priority}</span>
            </div>
          )}
          {event.tech && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-24 flex-shrink-0">Assigned:</span>
              <span className="font-semibold text-slate-800">{event.tech}</span>
            </div>
          )}
          {event.notes && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-24 flex-shrink-0">Notes:</span>
              <span className="text-slate-700">{event.notes}</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

export default function MaintenanceCalendar() {
  const [user, setUser] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFilters, setShowFilters] = useState({ workorders: true, maintenance: true });

  useEffect(() => {
    Promise.all([
      api.auth.me().catch(() => null),
      api.entities.WorkOrder.list('-created_date', 500),
      api.entities.MaintenanceSchedule.list('-created_date', 500),
      api.entities.Vehicle.list('-created_date', 200),
    ]).then(([u, wo, ms, v]) => {
      setUser(u);
      setWorkOrders(wo);
      setMaintenance(ms);
      setVehicles(v);
      setLoading(false);
    });
  }, []);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);

  const events = useMemo(() => {
    const all = [];
    if (showFilters.workorders) {
      workOrders.forEach(wo => {
        const date = wo.due_date || wo.opened_date;
        if (!date) return;
        const v = vehicleMap[wo.vehicle_id];
        all.push({
          id: `wo-${wo.id}`,
          source: 'workorder',
          date,
          title: wo.title || wo.repair_type,
          vehicle_label: v ? `Unit ${v.unit_number}` : 'Unknown',
          status: wo.status,
          priority: wo.priority,
          tech: wo.assigned_tech_id,
          notes: wo.complaint || wo.repair_notes,
        });
      });
    }
    if (showFilters.maintenance) {
      maintenance.forEach(ms => {
        if (!ms.due_date) return;
        const v = vehicleMap[ms.vehicle_id];
        all.push({
          id: `ms-${ms.id}`,
          source: 'maintenance',
          date: ms.due_date,
          title: ms.service_type,
          vehicle_label: v ? `Unit ${v.unit_number}` : 'Unknown',
          status: ms.status,
          tech: ms.assigned_tech,
          notes: ms.notes,
        });
      });
    }
    return all;
  }, [workOrders, maintenance, vehicleMap, showFilters]);

  const getEventsForDate = (date) => events.filter(e => e.date && isSameDay(parseISO(e.date), date));

  // Next-week spotlight
  const nextWeekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
  const nextWeekEnd = addDays(nextWeekStart, 6);
  const nextWeekEvents = events.filter(e => {
    if (!e.date) return false;
    const d = parseISO(e.date);
    return d >= nextWeekStart && d <= nextWeekEnd;
  });

  // Month calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = [];
  let d = calStart;
  while (d <= calEnd) { calDays.push(d); d = addDays(d, 1); }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const navigate = (dir) => {
    if (viewMode === 'month') setCurrentDate(prev => addMonths(prev, dir));
    else setCurrentDate(prev => addWeeks(prev, dir));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user?.role !== 'admin' && user?.role !== 'executive') return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center"><Shield className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Admin access required</p></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Maintenance Calendar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Work orders & scheduled maintenance at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggles */}
          <button
            onClick={() => setShowFilters(f => ({ ...f, workorders: !f.workorders }))}
            className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${showFilters.workorders ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            <Wrench className="w-3 h-3 inline mr-1" />Work Orders
          </button>
          <button
            onClick={() => setShowFilters(f => ({ ...f, maintenance: !f.maintenance }))}
            className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${showFilters.maintenance ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            <Calendar className="w-3 h-3 inline mr-1" />PM Schedule
          </button>
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {['month', 'week'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${viewMode === v ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next Week Spotlight */}
      {nextWeekEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-black text-amber-800 text-sm">Next Week — {nextWeekEvents.length} item{nextWeekEvents.length !== 1 ? 's' : ''} scheduled ({format(nextWeekStart, 'MMM d')}–{format(nextWeekEnd, 'MMM d')})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {nextWeekEvents.map(e => {
              const c = STATUS_COLOR[e.status] || STATUS_COLOR.scheduled;
              return (
                <button key={e.id} onClick={() => setSelectedEvent(e)} className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 hover:opacity-80 ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {format(parseISO(e.date), 'EEE d')} · {e.vehicle_label} · {e.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-base font-black text-slate-900">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate(new Date())} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 font-semibold mr-1">Today</button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase border-r border-slate-200 last:border-r-0">{day}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7">
              {calDays.map(day => (
                <DayCell
                  key={day.toISOString()}
                  date={day}
                  events={getEventsForDate(day)}
                  currentMonth={currentDate}
                  onClick={() => {}}
                  onEventClick={setSelectedEvent}
                />
              ))}
            </div>
          </div>
        ) : (
          <WeekView weekStart={weekStart} events={events} onEventClick={setSelectedEvent} />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.entries({ open: 'Open WO', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue PM', scheduled: 'Scheduled PM', upcoming: 'Due Soon' }).map(([k, label]) => {
          const c = STATUS_COLOR[k];
          return (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${c?.dot}`} />
              {label}
            </span>
          );
        })}
      </div>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}