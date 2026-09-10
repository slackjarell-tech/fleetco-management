import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  ScanLine, Package, CheckCircle, X, Plus, MapPin, ListOrdered, CloudOff, Camera,
} from 'lucide-react';
import { startBarcodeScanner, stopBarcodeScanner, getCurrentPosition } from '@/lib/nativeBridge';
import { formatStopAddress, hasDeliverableAddress, parseDeliveryBarcode } from '@/lib/barcodeParsers';
import CameraCapture from '@/components/driver/CameraCapture';

const MODES = [
  { id: 'deliver', label: 'Deliver Package', desc: 'Scan label → confirm stop → proof of delivery' },
  { id: 'build', label: 'Build Route', desc: 'Scan label → read Ship To address → add stop → optimize sequence' },
  { id: 'log', label: 'Log Scan', desc: 'Record barcode for office audit trail' },
];

export default function DriverScan() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState('build');
  const [scanning, setScanning] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState('');
  const [routeStops, setRouteStops] = useState(0);
  const [maxStops, setMaxStops] = useState(user?.max_stops_per_route || 200);
  const [pendingBarcode, setPendingBarcode] = useState('');
  const [labelParsing, setLabelParsing] = useState(false);
  const scannerRef = useRef(null);
  const scanAreaId = 'fleetco-barcode-reader';

  useEffect(() => {
    api.auth.me().then((u) => {
      if (u?.max_stops_per_route) setMaxStops(u.max_stops_per_route);
    });
    const today = new Date().toISOString().split('T')[0];
    api.entities.DeliveryRoute.filter({ driver_id: user.id }).then((routes) => {
      const r = routes.find((x) => x.route_date === today && x.status !== 'cancelled');
      if (r) {
        api.entities.DeliveryStop.filter({ route_id: r.id }).then((stops) => setRouteStops(stops.length));
      }
    });
  }, [user?.id]);

  const getGps = async () => {
    try {
      const pos = await getCurrentPosition();
      return { lat: pos.lat, lng: pos.lng };
    } catch {
      return { lat: null, lng: null };
    }
  };

  const addStopToRoute = async ({ barcode, parsed, labelImageUrl, lat, lng }) => {
    const result = await api.functions.invoke('addDeliveryStopFromScan', {
      barcode,
      parsed,
      labelImageUrl,
      lat,
      lng,
    });
    if (result._offlineQueued) {
      setRouteStops((n) => n + 1);
      setLastResult({ type: 'build', offline: true, barcode, message: result.message });
    } else {
      setRouteStops((n) => n + (result.created ? 1 : 0));
      setLastResult({ type: 'build', ...result });
    }
    return result;
  };

  const handleLabelPhoto = async (imageUrl) => {
    setError('');
    setLabelParsing(true);
    try {
      const { lat, lng } = await getGps();
      const labelResult = await api.functions.invoke('parseDeliveryLabel', {
        imageUrl,
        barcode: pendingBarcode || undefined,
      });

      const parsed = labelResult.parsed;
      if (!hasDeliverableAddress(parsed)) {
        throw new Error('Could not read delivery address — include the full Ship To block in the photo.');
      }

      await addStopToRoute({
        barcode: pendingBarcode || parsed.tracking_number,
        parsed,
        labelImageUrl: imageUrl,
        lat,
        lng,
      });

      setPendingBarcode('');
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Label read failed');
    } finally {
      setLabelParsing(false);
    }
  };

  const handleScan = async (code) => {
    setError('');
    const { lat, lng } = await getGps();

    try {
      if (mode === 'deliver') {
        const result = await api.functions.invoke('scanDeliveryPackage', { barcode: code, lat, lng });
        if (result._offlineQueued) {
          setLastResult({ type: 'deliver', offline: true, barcode: code, message: 'Scan saved offline — will sync when connected' });
          if (!continuous) {
            await stopBarcodeScanner(scannerRef.current);
            scannerRef.current = null;
            setScanning(false);
          }
          return;
        }
        setLastResult({ type: 'deliver', ...result });
        if (!continuous) {
          await stopBarcodeScanner(scannerRef.current);
          scannerRef.current = null;
          setScanning(false);
          navigate('/driver/route', { state: { podStopId: result.stop?.id } });
        }
        return;
      }

      if (mode === 'build') {
        const parsed = parseDeliveryBarcode(code);

        if (!hasDeliverableAddress(parsed)) {
          setPendingBarcode(code);
          setLastResult({
            type: 'label_needed',
            barcode: code,
            parsed,
            message: 'Tracking scanned — snap the whole label so we can read the Ship To address.',
          });
          if (!continuous) {
            await stopBarcodeScanner(scannerRef.current);
            scannerRef.current = null;
            setScanning(false);
          }
          return;
        }

        await addStopToRoute({ barcode: code, parsed, lat, lng });
        setPendingBarcode('');

        if (!continuous) {
          await stopBarcodeScanner(scannerRef.current);
          scannerRef.current = null;
          setScanning(false);
        }
        return;
      }

      const parsed = await api.functions.invoke('parseDeliveryBarcode', { barcode: code });
      const logged = await api.entities.BarcodeScan.create({
        driver_id: user.id,
        driver_name: user.full_name,
        customer_id: user.customer_id || '',
        barcode: code,
        scan_type: parsed.matchedStop ? 'delivery_stop' : 'unknown',
        linked_id: parsed.matchedStop?.id || '',
        label: parsed.parsed?.recipient_name
          ? `${parsed.parsed.recipient_name} — ${parsed.parsed.address}`
          : code,
        lat,
        lng,
        scanned_at: new Date().toISOString(),
      });
      setLastResult({ type: 'log', parsed, offline: logged._offlineQueued, barcode: code });
      if (!continuous) {
        await stopBarcodeScanner(scannerRef.current);
        scannerRef.current = null;
        setScanning(false);
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Scan failed');
      if (!continuous) {
        await stopBarcodeScanner(scannerRef.current);
        scannerRef.current = null;
        setScanning(false);
      }
    }
  };

  const beginScan = async () => {
    setScanning(true);
    setError('');
    setLastResult(null);
    setPendingBarcode('');
    try {
      scannerRef.current = await startBarcodeScanner(
        scanAreaId,
        handleScan,
        { continuous: continuous && mode !== 'deliver' }
      );
    } catch (err) {
      setScanning(false);
      setError(err?.message || 'Could not start camera scanner');
    }
  };

  const stopScan = async () => {
    await stopBarcodeScanner(scannerRef.current);
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => { stopBarcodeScanner(scannerRef.current); }, []);

  const optimizeRoute = async () => {
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const routes = await api.entities.DeliveryRoute.filter({ driver_id: user.id });
      const route = routes.find((r) => r.route_date === today && r.status !== 'cancelled');
      if (!route) throw new Error('No route for today — scan packages in Build Route mode first.');
      let lat;
      let lng;
      try {
        const pos = await getCurrentPosition();
        lat = pos.lat;
        lng = pos.lng;
      } catch { /* ok */ }
      await api.functions.invoke('geocodeDeliveryRoute', { routeId: route.id });
      const result = await api.functions.invoke('optimizeDeliveryRoute', {
        routeId: route.id,
        startLat: lat,
        startLng: lng,
      });
      setLastResult({ type: 'optimize', message: result.message });
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Optimize failed');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-amber-500" /> Package Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Scan the barcode, then snap the whole label if needed — we read the Ship To address to build and sequence your route.
        </p>
      </div>

      <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 text-xs">
        <span className="text-slate-600">Today&apos;s route stops</span>
        <span className="font-black text-slate-900">{routeStops} / {maxStops}</span>
      </div>

      <div className="grid gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setPendingBarcode(''); setError(''); }}
            className={`text-left px-4 py-3 rounded-xl border ${mode === m.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="font-bold text-sm text-slate-900">{m.label}</div>
            <div className="text-xs text-slate-500">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode === 'build' && (
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
          Continuous scan (keep adding stops — snap label when prompted)
        </label>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
      )}

      <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-square relative">
        <div id={scanAreaId} className="w-full h-full" />
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center pointer-events-none">
            <ScanLine className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Point camera at package barcode</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!scanning ? (
          <button type="button" onClick={beginScan}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl">
            {mode === 'deliver' ? 'Scan to Deliver' : mode === 'build' ? 'Scan Package Label' : 'Start Scanner'}
          </button>
        ) : (
          <button type="button" onClick={stopScan}
            className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Stop
          </button>
        )}
      </div>

      {(pendingBarcode || lastResult?.type === 'label_needed') && mode === 'build' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-amber-900">
            <Camera className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Snap the whole label</div>
              <p className="text-xs mt-1">
                Barcode captured{pendingBarcode ? `: ${pendingBarcode.slice(0, 24)}${pendingBarcode.length > 24 ? '…' : ''}` : ''}.
                Photograph the full label with the <strong>Ship To</strong> name and address visible.
              </p>
            </div>
          </div>
          <CameraCapture
            buttonLabel={labelParsing ? 'Reading label…' : 'Photograph Whole Label'}
            onCapture={(url) => handleLabelPhoto(url)}
          />
          {labelParsing && (
            <p className="text-xs text-amber-800 animate-pulse">Reading delivery address from label…</p>
          )}
        </div>
      )}

      {mode === 'build' && routeStops > 0 && (
        <button
          type="button"
          onClick={optimizeRoute}
          className="w-full flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-800 font-bold py-3 rounded-xl"
        >
          <ListOrdered className="w-5 h-5" /> Sequence Stops (Optimize Route)
        </button>
      )}

      {lastResult?.offline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <CloudOff className="w-4 h-4" /> Saved on device
          </div>
          <p className="text-xs text-amber-900">{lastResult.message || 'Will upload when you have signal.'}</p>
          {lastResult.barcode && <p className="font-mono text-[10px] text-amber-800 break-all">{lastResult.barcode}</p>}
        </div>
      )}

      {lastResult?.type === 'build' && lastResult.stop && !lastResult.offline && (
        <div className="bg-white border border-green-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
            <Plus className="w-4 h-4" />
            {lastResult.alreadyOnRoute ? 'Stop already on route' : `Stop #${lastResult.stop.sequence} added`}
          </div>
          <div className="font-bold text-slate-900">{lastResult.stop.recipient_name}</div>
          <div className="text-xs text-slate-600 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {formatStopAddress(lastResult.stop)}
          </div>
          {lastResult.stop.tracking_number && (
            <div className="text-xs font-mono text-slate-500">#{lastResult.stop.tracking_number}</div>
          )}
          <button type="button" onClick={() => navigate('/driver/route')}
            className="text-xs font-bold text-amber-600">View route →</button>
        </div>
      )}

      {lastResult?.type === 'deliver' && lastResult.stop && !lastResult.offline && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
            <CheckCircle className="w-4 h-4" /> Package matched
          </div>
          <div className="font-bold text-slate-900">Stop #{lastResult.stop.sequence} — {lastResult.stop.recipient_name}</div>
          <div className="text-xs text-slate-600">{formatStopAddress(lastResult.stop)}</div>
        </div>
      )}

      {lastResult?.type === 'optimize' && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3">
          {lastResult.message}
        </div>
      )}

      {lastResult?.type === 'log' && (lastResult.parsed || lastResult.offline) && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Package className="w-4 h-4" /> Scan logged{lastResult.offline ? ' (offline)' : ''}
          </div>
          <div className="font-mono text-xs break-all">{lastResult.parsed?.parsed?.raw || lastResult.barcode}</div>
          {lastResult.parsed?.parsed && hasDeliverableAddress(lastResult.parsed.parsed) && (
            <div className="text-xs text-slate-600">
              Parsed: {lastResult.parsed.parsed.recipient_name}, {lastResult.parsed.parsed.address}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Build Route: scan barcode → if tracking-only, photograph the full label → tap Sequence Stops to optimize delivery order. Label reading uses FleetCo AI when GEMINI_API_KEY is configured.
      </p>
    </div>
  );
}
