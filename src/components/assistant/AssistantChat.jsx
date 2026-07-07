import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { Send, Bot, Loader2, Plus, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (!message.content) return null;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-amber-500" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? 'bg-amber-500 text-slate-900 font-medium'
          : 'bg-slate-800 border border-slate-700 text-slate-100'
      }`}>
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_ul]:ml-4 [&_ol]:ml-4 [&_code]:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_code]:text-amber-300"
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function AssistantChat({ agentName = 'fleetco_assistant', title = 'FleetCo Assistant', subtitle = 'AI-powered fleet support', placeholder = 'Ask about your fleet, troubleshoot issues...', suggestedQuestions }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startNewConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewConversation = async () => {
    setStarting(true);
    setMessages([]);
    try {
      const conv = await api.agents.createConversation({
        agent_name: agentName,
        metadata: { name: `${title} Chat` },
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } finally {
      setStarting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const optimistic = [...messages, { role: 'user', content: text }];
    setMessages(optimistic);
    try {
      const updated = await api.agents.addMessage(conversation, { role: 'user', content: text });
      setConversation(updated);
      setMessages(updated.messages || []);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const defaultQuestions = suggestedQuestions || [
    'How do I create a work order?',
    'What does DTC code P0301 mean?',
    'How do HOS rules work?',
    'How do I invite a team member?',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{title}</div>
            <div className="text-slate-400 text-xs">{subtitle}</div>
          </div>
        </div>
        <button
          onClick={startNewConversation}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {starting ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Bot className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">How can I help you?</h3>
              <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {defaultQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 mb-1" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-4 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={starting}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || starting}
            className="w-10 h-10 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
