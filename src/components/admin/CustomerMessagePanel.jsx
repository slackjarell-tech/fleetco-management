import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { MessageCircle, Send, X } from 'lucide-react';

export default function CustomerMessagePanel({ customer, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const conversationId = `customer_${customer.id}`;

  const loadMessages = async () => {
    const all = await api.entities.Message.filter({ conversation_id: conversationId }, 'created_date', 50);
    setMessages(all);
  };

  useEffect(() => { loadMessages(); }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    await api.entities.Message.create({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      customer_id: customer.id,
      text: text.trim()
    });
    setText('');
    setSending(false);
    loadMessages();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-900 rounded-t-2xl flex-shrink-0">
          <div>
            <div className="text-white font-black text-sm">{customer.company_name}</div>
            <div className="text-slate-400 text-xs">{customer.contact_name}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No messages yet. Start the conversation.</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  isMe ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-700'
                }`}>
                  {!isMe && <div className="text-xs font-bold text-slate-400 mb-0.5">{msg.sender_name}</div>}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 flex gap-2 flex-shrink-0">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-3 py-2 rounded-lg disabled:opacity-50 self-end"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}