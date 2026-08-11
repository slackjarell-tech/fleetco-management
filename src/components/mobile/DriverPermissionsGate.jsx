import React from 'react';
import { Camera, MapPin, Video, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import FleetcoLogo from '@/components/home/FleetcoLogo';
import DriverAppBranding from '@/components/mobile/DriverAppBranding';
import { useDriverDevice } from '@/components/mobile/DriverDeviceProvider';

export default function DriverPermissionsGate({ userName }) {
  const { activating, activationError, activateDevices, skipLimitedMode } = useDriverDevice();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col max-w-lg mx-auto">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <FleetcoLogo size={40} variant="icon" />
          <div>
            <div className="font-black text-lg">FleetCo Driver</div>
            <div className="text-sm text-slate-400">ELD camera & GPS setup</div>
          </div>
        </div>

        <h1 className="text-2xl font-black mb-2">
          {userName ? `Hi ${userName.split(' ')[0]},` : 'Welcome,'}
        </h1>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          FleetCo needs your <strong className="text-white">camera</strong> and{' '}
          <strong className="text-white">location</strong> to turn this phone into a working ELD dashcam.
          Your fleet office sees live GPS and captured road footage while you drive.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex gap-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <Camera className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Camera</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Dashcam time-lapse, POD photos, inspections, and barcode scans.
              </div>
            </div>
          </div>
          <div className="flex gap-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Location</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Live fleet map, route progress, and GPS tags on every dashcam frame.
              </div>
            </div>
          </div>
          <div className="flex gap-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <Video className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">ELD dashcam</div>
              <div className="text-xs text-slate-400 mt-0.5">
                After you allow access, the app opens your rear camera and GPS immediately — ready on the Dashcam tab.
              </div>
            </div>
          </div>
        </div>

        {activationError && (
          <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-3 flex gap-2 text-sm text-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>{activationError}</p>
              <p className="text-xs text-red-300/80 mt-1">
                Open your phone Settings → Apps → FleetCo Driver → Permissions, then tap Try Again.
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto space-y-3">
          <button
            type="button"
            disabled={activating}
            onClick={activateDevices}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-black py-3.5 rounded-xl"
          >
            {activating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Enabling camera & GPS…
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" /> Allow Camera & Location
              </>
            )}
          </button>
          {(activationError || activating) && (
            <button
              type="button"
              disabled={activating}
              onClick={skipLimitedMode}
              className="w-full text-sm text-slate-400 hover:text-slate-200 py-2"
            >
              Continue without camera (route &amp; scan only)
            </button>
          )}
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Android and iOS will show system permission prompts. Both are required for ELD dashcam and fleet tracking.
          </p>
          <DriverAppBranding variant="gate" className="pt-2" />
        </div>
      </div>
    </div>
  );
}
