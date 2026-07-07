import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { ScanLine, Package, Archive, CheckCircle, X } from 'lucide-react';
import { startBarcodeScanner, stopBarcodeScanner, getCurrentPosition } from '@/lib/nativeBridge';

export default function DriverScan() {
  const { user } = useOutletContext();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const scanAreaId = 'fleetco-barcode-reader';

  const saveScan = async (code) => {
    setError('');
    let lat = null;
    let lng = null;
    try {
      const pos = await getCurrentPosition();
      lat = pos.lat;
      lng = pos.lng;
    } catch { /* optional */ }

    const parts = await api.entities.PartInventory.filter({ part_number: code });
    const loads = await api.entities.Load.filter({ load_number: code });
    const part = parts[0];
    const load = loads[0];

    let scanType = 'unknown';
    let linkedId = '';
    let label = code;
    if (part) { scanType = 'part'; linkedId = part.id; label = part.description || part.part_number; }
    else if (load) { scanType = 'load'; linkedId = load.id; label = `${load.origin_city} → ${load.destination_city}`; }

    const record = await api.entities.BarcodeScan.create({
      driver_id: user.id,
      driver_name: user.full_name,
      customer_id: user.customer_id || '',
      barcode: code,
      scan_type: scanType,
      linked_id: linkedId,
      label,
      lat,
      lng,
      scanned_at: new Date().toISOString(),
    });

    setLastScan(record);
    setMatch(part || load || null);
  };

  const beginScan = async () => {
    setScanning(true);
    setError('');
    setMatch(null);
    try {
      scannerRef.current = await startBarcodeScanner(scanAreaId, async (code) => {
        await stopBarcodeScanner(scannerRef.current);
        scannerRef.current = null;
        setScanning(false);
        await saveScan(code);
      });
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

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-amber-500" /> Scan Barcode
        </h1>
        <p className="text-slate-500 text-sm mt-1">Scan load labels, part numbers, or QR codes. Scans sync to your fleet office instantly.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
      )}

      <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-square relative">
        <div id={scanAreaId} className="w-full h-full" />
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ScanLine className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Tap below to scan with your phone camera</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!scanning ? (
          <button type="button" onClick={beginScan}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl">
            Start Scanner
          </button>
        ) : (
          <button type="button" onClick={stopScan}
            className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Stop
          </button>
        )}
      </div>

      {lastScan && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
            <CheckCircle className="w-4 h-4" /> Scan saved — visible to your fleet office
          </div>
          <div className="font-mono text-sm text-slate-800">{lastScan.barcode}</div>
          {lastScan.scan_type === 'part' && match && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Archive className="w-3.5 h-3.5" /> Part: {match.description} (qty {match.quantity})
            </div>
          )}
          {lastScan.scan_type === 'load' && match && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Package className="w-3.5 h-3.5" /> Load #{match.load_number} · {match.status}
            </div>
          )}
          {lastScan.scan_type === 'unknown' && (
            <div className="text-xs text-slate-500">No matching load or part — scan logged for review.</div>
          )}
        </div>
      )}
    </div>
  );
}
