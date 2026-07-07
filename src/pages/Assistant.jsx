import React from 'react';
import AssistantChat from '@/components/assistant/AssistantChat';

export default function Assistant() {
  return (
    <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <AssistantChat />
    </div>
  );
}