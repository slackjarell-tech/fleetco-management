import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import {
  Send, Bot, Loader2, Plus, MessageSquare, Wrench, Sparkles, AlertCircle, Zap, Crown, Megaphone,
  Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';
import {
  isRevanAutoSpeak,
  isRevanVoiceOn,
  listenOnce,
  markdownToSpeakable,
  setRevanAutoSpeak,
  setRevanVoiceOn,
  speakRevan,
  speechRecognitionAvailable,
  speechSynthesisAvailable,
  stopSpeaking,
} from '@/lib/revanVoice';
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
  const isPublic = variant === 'public';

  if (!message.content && !message.actions?.length) return null;

  const botIconWrap = isRevan
    ? 'bg-violet-500/20 border-violet-500/40'
    : isSlt
      ? 'bg-cyan-500/20 border-cyan-500/40'
      : isPublic
        ? 'bg-amber-100 border-amber-200'
        : 'bg-amber-500/20 border-amber-500/40';
  const botIconColor = isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : isPublic ? 'text-amber-600' : 'text-amber-500';
  const userBubble = isRevan
    ? 'bg-violet-500 text-white font-medium'
    : isSlt
      ? 'bg-cyan-500 text-slate-900 font-medium'
      : 'bg-amber-500 text-slate-900 font-medium';
  const assistantBubble = isPublic
    ? 'bg-slate-100 border border-slate-200 text-slate-800'
    : 'bg-slate-800 border border-slate-700 text-slate-100';

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
            isUser ? userBubble : assistantBubble
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
  channel = 'portal',
  title = 'Site Commander',
  subtitle = 'AI agent — reads & changes your site & fleet data',
  placeholder = 'Ask me to update the website, create work orders, list vehicles...',
  suggestedQuestions,
  emptyTitle = 'What should I change?',
  emptySubtitle = 'I can query fleet records and make real updates — website text, work orders, vehicles, and more.',
  showHeader = true,
  compact = false,
}) {
  const isRevan = variant === 'revan';
  const isSlt = variant === 'slt_marketing';
  const isPublic = channel === 'public';
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
  const [voiceOn, setVoiceOn] = useState(() => isRevanVoiceOn());
  const [autoSpeak, setAutoSpeak] = useState(() => isRevanAutoSpeak());
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const listenRef = useRef(null);

  useEffect(() => {
    startNewConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakAssistant = (msg) => {
    if (!isRevan || !voiceOn || !autoSpeak || !msg || msg.role !== 'assistant') return;
    const text = msg.spoken || markdownToSpeakable(msg.content);
    if (!text) return;
    speakRevan(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  useEffect(() => {
    if (!isRevan || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant' && !sending) speakAssistant(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sending, voiceOn, autoSpeak]);

  const startNewConversation = async () => {
    setStarting(true);
    setMessages([]);
    try {
      if (isRevan) {
        const status = await api.agents.getStatus().catch(() => ({ configured: false, revan_command_mode: true }));
        setAiStatus({ ...status, conversational: true });
        setConversation({ id: 'revan-dialogue', agent_name: 'revan' });
        setMessages([{ role: 'assistant', content: REVAN_LOCAL_WELCOME }]);
      } else {
        const client = isPublic ? api.marketingAi : api.agents;
        const [conv, status] = await Promise.all([
          isPublic
            ? client.createConversation()
            : client.createConversation({ agent_name: agentName, metadata: { name: `${title} Chat` } }),
          client.getStatus().catch(() => ({ configured: false })),
        ]);
        setAiStatus(status);
        setConversation(conv);
        setMessages(conv.messages || []);
      }
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
      if (isRevan) {
        const prior = messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20);
        const r = await api.revan.chat(text, prior);
        const assistant = {
          role: 'assistant',
          content: r.content || r.message?.content,
          spoken: r.spoken || r.message?.spoken,
        };
        setMessages([...optimistic, assistant]);
        if (r.ai_status) setAiStatus({ ...r.ai_status, conversational: true });
      } else {
        const client = isPublic ? api.marketingAi : api.agents;
        const updated = await client.addMessage(conversation, { role: 'user', content: text });
        setConversation(updated);
        setMessages(updated.messages || []);
        if (updated.ai_status) setAiStatus(updated.ai_status);
      }
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

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    setRevanVoiceOn(next);
    if (!next) stopSpeaking();
  };

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    setRevanAutoSpeak(next);
  };

  const handleMic = () => {
    if (listening) {
      listenRef.current?.stop?.();
      setListening(false);
      return;
    }
    if (!speechRecognitionAvailable()) {
      setInput('(Voice input needs Chrome/Edge — type your command.)');
      return;
    }
    setListening(true);
    listenRef.current = listenOnce({
      onResult: (transcript) => {
        setInput(transcript);
        setListening(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      },
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
  };

  const REVAN_LOCAL_WELCOME =
  '**Revan online.** Talk to me like Jarvis — ask how we are doing, follow up on leads, or drill into fleet. I remember this thread. Commands still work: **morning briefing**, **run business operations**, **call me**.';

const defaultQuestions = suggestedQuestions || [
    'List all open work orders',
    'Change the homepage headline to "FleetCo — Built for Owner Operators"',
    'How many vehicles are in the fleet?',
    'Create a work order for brake inspection on unit 104',
  ];

  return (
    <div className={`flex flex-col h-full min-h-0 ${isPublic ? 'bg-white' : 'bg-slate-950'}`}>
      {showHeader && (
      <div className={`flex items-center justify-between px-5 py-4 border-b ${isPublic ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            isRevan ? 'bg-violet-500/20 border-violet-500/40' : isSlt ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-amber-500/20 border-amber-500/40'
          }`}>
            <HeaderIcon className={`w-5 h-5 ${isRevan ? 'text-violet-400' : isSlt ? 'text-cyan-400' : 'text-amber-500'}`} />
          </div>
          <div>
            <div className={`font-bold text-sm flex items-center gap-2 ${isPublic ? 'text-slate-900' : 'text-white'}`}>
              {title}
              {aiStatus?.configured && (
                <span className="text-[10px] font-normal uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Free AI · {aiStatus.provider}
                </span>
              )}
              {isRevan && (
                <span className="text-[10px] font-normal uppercase tracking-wide text-violet-300 bg-violet-950/50 border border-violet-700 px-1.5 py-0.5 rounded">
                  {aiStatus?.configured ? `Jarvis · ${aiStatus.provider}` : 'Jarvis · dialogue'}
                </span>
              )}
              {!aiStatus?.configured && isSlt && (
                <span className="text-[10px] font-normal uppercase tracking-wide text-cyan-300 bg-cyan-950/50 border border-cyan-800 px-1.5 py-0.5 rounded">
                  Command mode
                </span>
              )}
            </div>
            <div className={`text-xs ${isPublic ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRevan && speechSynthesisAvailable() && (
            <>
              <button
                type="button"
                title={voiceOn ? 'Jarvis voice on' : 'Jarvis voice off'}
                onClick={toggleVoice}
                className={`p-2 rounded-lg border ${voiceOn ? 'border-violet-500/50 text-violet-300 bg-violet-950/40' : 'border-slate-700 text-slate-500 bg-slate-800'}`}
              >
                {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                title={autoSpeak ? 'Auto-speak replies' : 'Text only'}
                onClick={toggleAutoSpeak}
                className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded border ${autoSpeak ? 'border-violet-700 text-violet-300' : 'border-slate-700 text-slate-500'}`}
              >
                {autoSpeak ? 'Speak' : 'Mute'}
              </button>
            </>
          )}
          {!compact && (
          <button
            type="button"
            onClick={startNewConversation}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isPublic ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200' : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
          )}
        </div>
      </div>
      )}

      {!aiStatus?.configured && !starting && !isRevan && !isSlt && (
        <div className={`mx-4 mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${
          isPublic
            ? 'text-amber-900 bg-amber-50 border-amber-200'
            : 'text-amber-200/90 bg-amber-950/30 border-amber-800/40'
        }`}>
          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPublic ? 'text-amber-600' : 'text-amber-400'}`} />
          <span>
            {isPublic
              ? 'Our AI assistant is starting up. Email support@fleetcomanagement.org or call (360) 952-1249 meanwhile.'
              : <>Add a free <strong>GROQ_API_KEY</strong> on your server (console.groq.com) — or <strong>GEMINI_API_KEY</strong> — no credit card required.</>}
          </span>
        </div>
      )}
      {!aiStatus?.configured && !starting && isRevan && (
        <div className="mx-4 mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border text-violet-200/90 bg-violet-950/30 border-violet-800/40">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-400" />
          <span>
            <strong>Conversation mode</strong> — talk naturally; I remember this thread. Voice + mic + call me still work. Optional <strong>GROQ_API_KEY</strong> adds even freer reasoning.
            {speaking && <span className="block mt-1 text-violet-300">Speaking…</span>}
          </span>
        </div>
      )}
      {!aiStatus?.configured && !starting && isSlt && (
        <div className="mx-4 mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border text-cyan-200/90 bg-cyan-950/30 border-cyan-800/40">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
          <span>
            <strong>Command mode</strong> — show dashboard, list leads, run autopilot work without Groq. Optional <strong>GROQ_API_KEY</strong> for free-form chat.
          </span>
        </div>
      )}

      <div className={`flex-1 min-h-0 overflow-y-auto px-4 ${compact ? 'py-3' : 'py-5'} space-y-4`}>
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
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} variant={isPublic ? 'public' : variant} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`px-4 py-4 border-t ${isPublic ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900'}`}>
        <div className="flex gap-2 items-end">
          {isRevan && (
            <button
              type="button"
              onClick={handleMic}
              disabled={starting || sending}
              title="Voice command"
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                listening
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-violet-300 hover:bg-slate-700'
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none ${
              isPublic
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                : `bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 ${isRevan ? 'focus:border-violet-500' : isSlt ? 'focus:border-cyan-500' : 'focus:border-amber-500'}`
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
        {!compact && (
        <p className={`text-xs mt-2 text-center ${isPublic ? 'text-slate-400' : 'text-slate-600'}`}>
          Enter to send · {isPublic ? 'Ask about pricing, features, or request a demo' : isRevan ? 'Mic for voice · Jarvis speaks when Speak is on · say Call me for phone briefing' : isSlt ? 'Email leads, social posts, and schedule calls' : 'AI can modify your site & fleet data when configured'}
        </p>
        )}
      </div>
    </div>
  );
}
