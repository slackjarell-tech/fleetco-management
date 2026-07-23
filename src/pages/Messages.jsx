import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { MessageCircle, Send, ChevronLeft, User, Building2, UserCheck } from 'lucide-react';
import PortalPageShell from '@/components/layout/PortalPageShell';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Customer messaging state
  const [customerRecord, setCustomerRecord] = useState(null);
  const [accountReps, setAccountReps] = useState([]);

  useEffect(() => {
    const init = async () => {
      const u = await api.auth.me();
      setUser(u);
      const allUsers = await api.entities.User.list();
      const driverList = allUsers.filter(u => u.role === 'driver');
      setDrivers(driverList);

      // If current user is a driver, auto-select themselves as the "inbox" view
      if (u?.role === 'driver') {
        setSelectedDriver(u);
      }

      // If current user is a customer, load their customer record
      if (u?.role === 'user' && u?.customer_id) {
        try {
          const customers = await api.entities.Customer.filter({});
          const myCustomer = customers.find(c => c.user_id === u.id || c.id === u.customer_id);
          if (myCustomer) {
            setCustomerRecord(myCustomer);
            // Find assigned account reps
            const reps = [];
            if (myCustomer.assigned_manager_id) {
              const mgr = allUsers.find(m => m.id === myCustomer.assigned_manager_id);
              if (mgr) reps.push({ ...mgr, title: 'Fleet Manager' });
            }
            if (myCustomer.assigned_coordinator_id) {
              const coord = allUsers.find(m => m.id === myCustomer.assigned_coordinator_id);
              if (coord) reps.push({ ...coord, title: 'Fleet Coordinator' });
            }
            setAccountReps(reps);
          }
        } catch (_) {}
      }
      setLoading(false);
    };
    init();
  }, []);

  // Load messages for selected driver conversation
  useEffect(() => {
    if (!selectedDriver || !user) return;
    const convId = `driver_${selectedDriver.id}`;
    const unsubscribe = api.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === convId || event.type === 'delete') {
        loadMessages(convId);
      }
    });
    loadMessages(convId);
    return () => unsubscribe();
  }, [selectedDriver, user]);

  // Load customer conversation messages
  useEffect(() => {
    if (!customerRecord || !user) return;
    const convId = `customer_${customerRecord.id}`;
    const unsubscribe = api.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === convId || event.type === 'delete') {
        loadMessages(convId);
      }
    });
    loadMessages(convId);
    return () => unsubscribe();
  }, [customerRecord, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId) => {
    const msgs = await api.entities.Message.filter({ conversation_id: convId }, 'created_date', 100);
    setMessages(msgs);
    // Mark unread messages as read for the receiving user
    if (user?.role === 'driver' || user?.role === 'user') {
      msgs.filter(m => !m.read && m.sender_id !== user.id).forEach(m => {
        api.entities.Message.update(m.id, { read: true });
      });
    }
  };

  const handleSendDriver = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedDriver || sending) return;
    setSending(true);
    const convId = `driver_${selectedDriver.id}`;
    await api.entities.Message.create({
      conversation_id: convId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      recipient_driver_id: selectedDriver.id,
      text: text.trim(),
      read: false,
    });
    setText('');
    setSending(false);
  };

  const handleSendCustomer = async () => {
    if (!text.trim() || !customerRecord || sending) return;
    setSending(true);
    await api.entities.Message.create({
      conversation_id: `customer_${customerRecord.id}`,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      customer_id: customerRecord.id,
      text: text.trim(),
      read: false,
    });
    setText('');
    setSending(false);
  };

  const handleCustomerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCustomer();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isDriver = user?.role === 'driver';
  const isCustomer = user?.role === 'user' && customerRecord;

  // ── Customer Messaging View ──
  if (isCustomer) {
    return (
      <PortalPageShell variant="fullBleed" className="!bg-white">
      <div className="flex flex-1 min-h-0 w-full bg-white overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with account rep info */}
          <div className="px-5 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">{customerRecord.company_name}</div>
                <div className="text-xs text-slate-500">Contact your account rep</div>
              </div>
            </div>
            {accountReps.length > 0 && (
              <div className="flex gap-3 ml-13 mt-2">
                {accountReps.map(rep => (
                  <div key={rep.id} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {rep.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700">{rep.full_name}</div>
                      <div className="text-slate-400">{rep.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {accountReps.length === 0 && (
              <p className="text-xs text-slate-400 ml-13 mt-1">An account rep will be assigned to you soon.</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-16">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No messages yet</p>
                <p className="text-xs mt-1">Send a message to get in touch with your account rep</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <span className="text-xs text-slate-400 mb-1 px-1">{msg.sender_name} · {msg.sender_role?.replace(/_/g, ' ')}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-amber-500 text-slate-900 rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-slate-300 mt-1 px-1">
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleCustomerKeyDown}
              placeholder="Message your account rep..."
              rows={2}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
            />
            <button
              onClick={handleSendCustomer}
              disabled={!text.trim() || sending}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 p-2.5 rounded-xl transition-colors self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </PortalPageShell>
    );
  }

  // ── Driver Messaging View (existing) ──
  return (
    <PortalPageShell variant="fullBleed" className="!bg-white">
      <div className="flex flex-1 min-h-0 w-full bg-white overflow-hidden">
      {/* Sidebar: driver list (hidden for drivers) */}
      {!isDriver && (
        <aside className={`w-64 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50 ${selectedDriver ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-4 border-b border-slate-200">
            <h1 className="font-black text-slate-900 text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-500" /> Driver Messages
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Select a driver to message</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {drivers.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-10">No drivers found</p>
            )}
            {drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className={`w-full text-left px-4 py-3.5 hover:bg-amber-50 transition-colors flex items-center gap-3 ${selectedDriver?.id === driver.id ? 'bg-amber-50 border-l-2 border-amber-500' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 font-bold text-slate-600 text-sm">
                  {driver.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{driver.full_name}</div>
                  <div className="text-xs text-slate-400">Driver</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Driver header for drivers */}
        {isDriver && (
          <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm">My Messages</div>
              <div className="text-xs text-slate-500">Communications from your team</div>
            </div>
          </div>
        )}

        {/* Non-driver: show chat header or empty state */}
        {!isDriver && !selectedDriver && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a driver to start a conversation</p>
            </div>
          </div>
        )}

        {!isDriver && selectedDriver && (
          <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center gap-3">
            <button onClick={() => setSelectedDriver(null)} className="md:hidden text-slate-400 hover:text-slate-700 mr-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
              {selectedDriver.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{selectedDriver.full_name}</div>
              <div className="text-xs text-slate-400">Driver</div>
            </div>
          </div>
        )}

        {/* Messages */}
        {(selectedDriver || isDriver) && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-10">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <span className="text-xs text-slate-400 mb-1 px-1">{msg.sender_name} · {msg.sender_role}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-amber-500 text-slate-900 rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-xs text-slate-300 mt-1 px-1">
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendDriver} className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 p-2.5 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    </PortalPageShell>
  );
}