import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { Send, Bot, Loader2, Plus, MessageSquare, Wrench, Sparkles, AlertCircle, Zap, Crown, Megaphone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function ActionChip({ action }) {
  const ok = action.result?.success !== false;
  return (
    <div className={`text-xs rounded-lg px-3 py-2 border ${ok ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-red-950/40 border-red-800/50 text-red-300'}`}>
      <span className="font-mono font-semibold">{action.tool}</span>
      {!ok && action.result?.error && <span className="ml-2 opacity-80">— {action.result.error}</span>}
    </div>
  );
}

function MessageBubble({ message, variant = 'default' }) {
  const isUser = message.role === 'user';
  const isRevan = variant === 'revan';
  const isSlt = variant === 'slt_marketing';

  if (!message.content && !message.actions?.length) return null;

  const botIconWrap = isRevan
    ? 'bg-violet-500/20 border-violet-500/40'
    : isSlt
      ? 'bg-cyan-500/20 border-cyan-500/40'
      : 'bg-amber-500/20 border-amber-500/40';
  const botIconColor = isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-500';
  const userBubble = isRevan
    ? 'bg-violet-500 text-white font-medium'
    : isSlt
      ? 'bg-cyan-500 text-slate-900 font-medium'
      : 'bg-amber-500 text-slate-900 font-medium';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${botIconWrap}`}>
          <Bot className={`w-4 h-4 ${botIconColor}`} />
        </div>
      )}
      <div className={`max-w-[85%] space-y-2 ${isUser ? '' : ''}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${
            isUser ? userBubble : 'bg-slate-800 border border-slate-700 text-slate-100'
          }`}>
            {isUser ? (
              <p className="leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_ul]:ml-4 [&_ol]:ml-4 [&_code]:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_code]:text-amber-300 [&_a]:text-amber-400"
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.actions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.actions.map((action, i) => (
              <ActionChip key={i} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantChat({
  agentName = 'site_commander',
  variant = 'default',
  title = 'Site Commander',
  subtitle = 'AI agent — reads & changes your site & fleet data',
  placeholder = 'Ask me to update the website, create work orders, list vehicles...',
  suggestedQuestions,
  emptyTitle = 'What should I change?',
  emptySubtitle = 'I can query fleet records and make real updates — website text, work orders, vehicles, and more.',
}) {
  const isRevan = variant === 'revan';
  const isSlt = variant === 'slt_marketing';
  const HeaderIcon = isRevan ? Crown : isSlt ? Megaphone : Sparkles;
  const EmptyIcon = isRevan ? Zap : isSlt ? Megaphone : Wrench;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);
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
      const [conv, status] = await Promise.all([
        api.agents.createConversation({
          agent_name: agentName,
          metadata: { name: `${title} Chat` },
        }),
        api.agents.getStatus().catch(() => ({ configured: false })),
      ]);
      setAiStatus(status);
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
      if (updated.ai_status) setAiStatus(updated.ai_status);
    } catch (err) {
      setMessages([
        ...optimistic,
        { role: 'assistant', content: `Something went wrong: ${err.message || 'Please try again.'}` },
      ]);
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
    'List all open work orders',
    'Change the homepage headline to "FleetCo — Built for Owner Operators"',
    'How many vehicles are in the fleet?',
    'Create a work order for brake inspection on unit 104',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            isRevan ? 'bg-violet-500/20 border-violet-500/40' : isSlt ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-amber-500/20 border-amber-500/40'
          }`}>
            <HeaderIcon className={`w-5 h-5 ${isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-500'}`} />
          </div>
          <div>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              {title}
              {aiStatus?.configured && (
                <span className="text-[10px] font-normal uppercase tracking-wide text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                  {aiStatus.provider} live
                </span>
              )}
            </div>
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

      {!aiStatus?.configured && !starting && (
        <div className={`mx-4 mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${
          isRevan
            ? 'text-violet-200/90 bg-violet-950/30 border-violet-800/40'
            : isSlt
              ? 'text-cyan-200/90 bg-cyan-950/30 border-cyan-800/40'
              : 'text-amber-200/90 bg-amber-950/30 border-amber-800/40'
        }`}>
          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-400'}`} />
          <span>
            Add a free <strong>GROQ_API_KEY</strong> in Render environment variables to enable AI changes.
            Get one at console.groq.com — no credit card required.
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {starting ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className={`w-6 h-6 animate-spin ${isRevan ? 'text-violet-500' : isSlt ? 'text-cyan-500' : 'text-amber-500'}`} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
              isRevan ? 'bg-violet-500/10 border-violet-500/30' : isSlt ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <EmptyIcon className={`w-8 h-8 ${isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-500'}`} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">{emptyTitle}</h3>
              <p className="text-slate-400 text-sm max-w-md">{emptySubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {defaultQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <MessageSquare className={`w-3.5 h-3.5 mb-1 ${isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-500'}`} />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} variant={variant} />)
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
            className={`flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none ${
              isRevan ? 'focus:border-violet-500' : isSlt ? 'focus:border-cyan-500' : 'focus:border-amber-500'
            }`}
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={starting}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || starting}
            className={`w-10 h-10 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isRevan
                ? 'bg-violet-500 hover:bg-violet-400 text-white'
                : isSlt
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">
          Enter to send · {isSlt ? 'AI can email leads, queue social posts, and schedule calls' : 'AI can modify your site & fleet data when configured'}
        </p>
      </div>
    </div>
  );
}
