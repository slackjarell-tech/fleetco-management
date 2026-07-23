import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import AssistantChat from '@/components/assistant/AssistantChat';

export default function MarketingAiWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[80] sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[min(100vw-2rem,400px)] sm:h-[min(70vh,560px)] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 overflow-hidden bg-white flex flex-col">
          <div className="sm:hidden flex justify-end p-2 border-b border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className="p-2 text-slate-500" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <AssistantChat
              channel="public"
              variant="default"
              title="FleetCo Guide"
              subtitle="Pricing · features · demo requests"
              placeholder="Ask about fleet size, pricing, or request a demo…"
              emptyTitle="How can FleetCo help your fleet?"
              emptySubtitle="I answer questions about our portal, driver app, payroll, and compliance — and connect you with the team."
              suggestedQuestions={[
                'What does FleetCo cost for 5 trucks?',
                'Do you help with IFTA and driver payroll?',
                'I want a demo — we run 12 units in Texas',
                'What is included in the Growth plan?',
              ]}
              showHeader
              compact={false}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-3 rounded-full shadow-lg shadow-amber-500/30 transition-colors"
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {open ? 'Close' : 'Ask FleetCo AI'}
      </button>
    </>
  );
}
