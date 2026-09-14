import React from 'react';
import ChunkedLiveViewer from '@/components/live/ChunkedLiveViewer';
import LiveStreamViewer from '@/components/live/LiveStreamViewer';
import LiveDriverMap from '@/components/live/LiveDriverMap';

/** Command-center view: live road feed + map (no API keys for chunked mode). */
export default function LiveSessionPanel({ session, livekitConfigured }) {
  const mode = session.stream_mode === 'local' ? 'chunked' : session.stream_mode;
  const useLiveKit = mode === 'livekit' && livekitConfigured;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {useLiveKit ? (
          <LiveStreamViewer session={session} />
        ) : (
          <ChunkedLiveViewer session={session} />
        )}
        <LiveDriverMap session={session} />
      </div>
    </div>
  );
}
