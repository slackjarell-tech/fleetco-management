import { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RefreshCw, Radio, Truck } from 'lucide-react';

export default function SimulatorPanel() {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driverCount, setDriverCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  const checkStatus = async () => {
    try {
      // Check if there are recent simulated driver locations (last 2 min)
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const locs = await api.entities.DriverLocation.filter({}, '-timestamp', 100);
      const simLocs = (locs || []).filter(l => l.user_id?.startsWith('sim_driver_'));
      const recent = simLocs.filter(l => l.timestamp > twoMinAgo);
      setRunning(recent.length > 0);
      setDriverCount(new Set(recent.map(l => l.user_id)).size);
      if (recent.length > 0) {
        setLastUpdate(new Date(recent[0].timestamp));
      }
    } catch {
      setRunning(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (running) {
        // Stop - clear sim data
        const locs = await api.entities.DriverLocation.filter({}, '-timestamp', 500);
        const simLocs = (locs || []).filter(l => l.user_id?.startsWith('sim_driver_'));
        for (const loc of simLocs) {
          await api.entities.DriverLocation.delete(loc.id).catch(() => {});
        }
        setRunning(false);
        setDriverCount(0);
        setLastUpdate(null);
      } else {
        // Start - initialize drivers
        await api.functions.invoke('simulateDrivers', { action: 'reset' });
        setRunning(true);
        setDriverCount(7);
        setLastUpdate(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async () => {
    setLoading(true);
    try {
      await api.functions.invoke('simulateDrivers', { action: 'step' });
      await checkStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${running ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
          <h3 className="font-semibold text-sm text-slate-900">Driver Simulator</h3>
          {running && (
            <Badge className="bg-green-100 text-green-700 text-xs">Running</Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          {running ? `${driverCount} simulated drivers moving` : 'Simulation stopped'}
        </span>
      </div>

      {lastUpdate && (
        <p className="text-xs text-slate-400 mb-3">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={running ? 'destructive' : 'default'}
          onClick={handleToggle}
          disabled={loading}
          className={running ? '' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'}
        >
          {running ? (
            <><Square className="w-3.5 h-3.5 mr-1" /> Stop</>
          ) : (
            <><Play className="w-3.5 h-3.5 mr-1" /> Start Simulation</>
          )}
        </Button>
        {running && (
          <Button size="sm" variant="outline" onClick={handleStep} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Step
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Simulates 7 drivers on major US highway routes. Use with Fleet Map to see live movement.
      </p>
    </div>
  );
}