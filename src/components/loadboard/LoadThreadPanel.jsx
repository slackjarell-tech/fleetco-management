import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, MessageCircle, Shield } from 'lucide-react';

export default function LoadThreadPanel({ load, onClose, readOnly = false }) {
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('messages');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!load?.id) return;
    setLoading(true);
    Promise.all([
      api.functions.invoke('listLoadMessages', { loadId: load.id }),
      api.functions.invoke('listLoadMarketplaceEvents', { loadId: load.id }).catch(() => ({ events: [] })),
    ])
      .then(([msgRes, evtRes]) => {
        setMessages(msgRes.messages || []);
        setEvents(evtRes.events || []);
      })
      .catch(() => {
        setMessages([]);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [load?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events, tab]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || sending || readOnly) return;
    setSending(true);
    try {
      const res = await api.functions.invoke('postLoadMessage', { loadId: load.id, body });
      if (res.message) setMessages((prev) => [...prev, res.message]);
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <MessageCircle className="w-4 h-4 text-amber-500" />
              Load #{load.load_number} — Communications
            </div>
            <div className="text-xs text-slate-500">{load.origin} → {load.destination}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-start gap-2 text-xs text-slate-600">
          <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>All messages and booking activity are permanent records. FleetCo SLT has full visibility to protect brokers and carriers.</span>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium ${tab === 'messages' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-slate-500'}`}
            onClick={() => setTab('messages')}
          >
            Messages ({messages.length})
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium ${tab === 'activity' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-slate-500'}`}
            onClick={() => setTab('activity')}
          >
            Booking log ({events.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {loading && (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          )}
          {!loading && tab === 'messages' && messages.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No messages yet. Brokers and carriers can coordinate here before and after booking.</p>
          )}
          {!loading && tab === 'activity' && events.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No booking activity logged yet.</p>
          )}
          {tab === 'messages' && messages.map((m) => (
            <div key={m.id} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">
                  {m.sender_name || 'User'}
                  {m.sender_role === 'freight_broker' && <span className="text-[10px] ml-1 text-amber-700 font-normal">Broker</span>}
                </span>
                <span className="text-[10px] text-slate-400">{m.created_date?.slice(0, 16).replace('T', ' ')}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
          {tab === 'activity' && events.map((ev) => (
            <div key={ev.id} className="bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">{ev.action?.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-slate-400">{ev.created_date?.slice(0, 16).replace('T', ' ')}</span>
              </div>
              <p className="text-sm text-slate-700">{ev.summary}</p>
              <p className="text-[10px] text-slate-500 mt-1">{ev.actor_name}{ev.actor_role ? ` · ${ev.actor_role}` : ''}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {!readOnly && tab === 'messages' && (
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message broker or carrier…"
              className="flex-1"
            />
            <Button type="submit" disabled={!body.trim() || sending} className="bg-amber-500 text-slate-900 font-bold">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
