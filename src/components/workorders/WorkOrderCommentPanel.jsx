import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export function WorkOrderCommentsList({ comments = [] }) {
  if (!comments.length) return null;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Team comments (driver / HR)
      </div>
      <ul className="space-y-2 text-sm text-slate-700">
        {comments.map((c, i) => (
          <li key={i} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
            <span className="text-slate-400 text-xs">
              {c.at?.slice(0, 16).replace('T', ' ')} · {c.by}
              {c.by_role ? ` (${c.by_role.replace('customer_', '')})` : ''}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkOrderCommentPanel({ onSubmit }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSubmit(trimmed);
      setText('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-cyan-200 bg-cyan-50 rounded-xl p-4 space-y-2">
      <div className="text-sm font-bold text-cyan-900">Add a comment for the shop</div>
      <p className="text-xs text-cyan-800/80">
        Visible to your fleet manager and mechanic. You cannot change repair details here.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Share context, urgency, or updates…"
        className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm resize-none bg-white"
      />
      <button
        type="button"
        disabled={!text.trim() || saving}
        onClick={submit}
        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Post comment
      </button>
    </div>
  );
}
