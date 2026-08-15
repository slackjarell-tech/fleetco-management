import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadBoardFeeAcknowledgment from '@/components/loadboard/LoadBoardFeeAcknowledgment';
import { Loader2 } from 'lucide-react';

export default function LoadBoardFeeGate({ onAcknowledged }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!checked) return;
    setLoading(true);
    setError('');
    try {
      await api.functions.invoke('acknowledgeLoadBoardFee', {
        load_board_fee_acknowledged: true,
        source: 'load_board_gate',
      });
      onAcknowledged?.();
    } catch (err) {
      setError(err.message || 'Could not save acknowledgment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-black text-slate-900 mb-2">Load Board terms</h2>
        <p className="text-sm text-slate-500 mb-4">
          Before posting or booking freight, review the platform fee and payment authorization below.
        </p>
        <LoadBoardFeeAcknowledgment checked={checked} onChange={setChecked} />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <Button
          className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
          disabled={!checked || loading}
          onClick={handleContinue}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Continue to Load Board'}
        </Button>
      </div>
    </div>
  );
}
