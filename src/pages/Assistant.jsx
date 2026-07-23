import React from 'react';
import AssistantChat from '@/components/assistant/AssistantChat';
import PortalPageShell from '@/components/layout/PortalPageShell';

export default function Assistant() {
  return (
    <PortalPageShell variant="fullBleed">
      <AssistantChat />
    </PortalPageShell>
  );
}
