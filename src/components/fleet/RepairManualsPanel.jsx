import React from 'react';
import { X, ExternalLink, BookOpen, Wrench, Youtube, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MANUAL_SOURCES = [
  {
    category: 'Professional OEM & Shop Manuals',
    color: 'bg-red-700',
    items: [
      {
        name: 'AllData DIY',
        desc: 'Factory OEM repair data — the #1 choice for shops. Year/Make/Model specific.',
        url: (v) => `https://www.alldata.com/repair/${v.year || ''}/${encodeURIComponent(v.make || '')}/${encodeURIComponent(v.model || '')}`,
        badge: 'PAID',
        badgeColor: 'bg-red-100 text-red-700',
      },
      {
        name: 'Mitchell 1 ProDemand',
        desc: 'Industry-leading repair software used by professional technicians.',
        url: () => 'https://mitchell1.com/prodemand/',
        badge: 'PAID',
        badgeColor: 'bg-red-100 text-red-700',
      },
      {
        name: 'Chilton Library',
        desc: 'Step-by-step repair guides — often free via public library access.',
        url: (v) => `https://chilton.cengage.com/`,
        badge: 'LIBRARY',
        badgeColor: 'bg-green-100 text-green-700',
      },
    ],
  },
  {
    category: 'Heavy Truck / Commercial OEM Portals',
    color: 'bg-amber-700',
    items: [
      {
        name: 'Kenworth Service Portal',
        desc: 'Factory service manuals and bulletins direct from Kenworth.',
        url: () => 'https://www.kenworth.com/owners/service-manuals/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Peterbilt Service Docs',
        desc: 'Peterbilt official service and parts documentation.',
        url: () => 'https://www.peterbilt.com/service/service-and-parts',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Freightliner Service Portal',
        desc: 'Detroit Diesel & Freightliner service literature.',
        url: () => 'https://www.freightliner.com/service/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'International / Navistar',
        desc: 'Service information for International trucks.',
        url: () => 'https://www.internationaltrucks.com/service',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Mack Trucks Service',
        desc: 'Mack service manuals and technical support.',
        url: () => 'https://www.macktrucks.com/owner-services/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Volvo Trucks Portal',
        desc: 'Volvo Trucks technical service documentation.',
        url: () => 'https://www.volvotrucks.us/support/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
    ],
  },
  {
    category: 'Ford, Dodge / RAM & Freightliner',
    color: 'bg-blue-700',
    items: [
      {
        name: 'Ford Service Info (PTS)',
        desc: 'Official Ford Professional Technician Society — workshop manuals, TSBs, wiring diagrams.',
        url: (v) => `https://www.motorcraftservice.com/`,
        badge: 'OEM',
        badgeColor: 'bg-blue-100 text-blue-700',
      },
      {
        name: 'Ford F-Series / Super Duty Workshop',
        desc: 'Ford F-150, F-250, F-350, F-450 and Super Duty repair guides via ALLDATA.',
        url: (v) => `https://www.alldata.com/repair/${v.year || ''}/${encodeURIComponent('Ford')}/${encodeURIComponent(v.model || 'F-250')}`,
        badge: 'PAID',
        badgeColor: 'bg-red-100 text-red-700',
      },
      {
        name: 'FordTechMakuloco (YouTube)',
        desc: 'Top-rated Ford technician video tutorials — Super Duty, Powerstroke diesel, and more.',
        url: (v) => `https://www.youtube.com/@FordTechMakuloco`,
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
        icon: Youtube,
      },
      {
        name: 'Mopar Owner Connect (RAM/Dodge)',
        desc: 'Official Stellantis portal for RAM truck and Dodge service documentation.',
        url: () => 'https://www.mopar.com/en-us/my-vehicle/recalls-and-service/owner-connect.html',
        badge: 'OEM',
        badgeColor: 'bg-red-100 text-red-700',
      },
      {
        name: 'RAM Trucks Service Info',
        desc: 'RAM 1500, 2500, 3500 ProMaster service guides and TSBs.',
        url: (v) => `https://www.alldata.com/repair/${v.year || ''}/${encodeURIComponent('Ram')}/${encodeURIComponent(v.model || '2500')}`,
        badge: 'PAID',
        badgeColor: 'bg-red-100 text-red-700',
      },
      {
        name: 'Dodge / Cummins Forums',
        desc: 'Dodge RAM Cummins diesel community repair guides and walk-throughs.',
        url: () => 'https://www.cumminsforum.com/',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
      {
        name: 'Freightliner Service Portal',
        desc: 'Official Daimler/Freightliner service literature — Cascadia, Coronado, M2, Sprinter.',
        url: () => 'https://www.freightliner.com/service/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Freightliner Cascadia Workshop Manual',
        desc: 'Detroit Diesel & Freightliner Cascadia technical service documentation.',
        url: () => 'https://www.dda.training/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Sprinter Source (Freightliner Sprinter)',
        desc: 'Community forum and repair guides for Freightliner / Mercedes Sprinter vans.',
        url: () => 'https://www.sprinter-source.com/',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
    ],
  },
  {
    category: 'Engine & Component Manuals',
    color: 'bg-slate-700',
    items: [
      {
        name: 'Cummins QuickServe Online',
        desc: 'Free Cummins engine service documentation by serial number.',
        url: () => 'https://quickserve.cummins.com/',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
      {
        name: 'Detroit Diesel DDCSN',
        desc: 'Detroit Diesel service and calibration network.',
        url: () => 'https://www.detroitdiesel.com/service',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'PACCAR Tech Support',
        desc: 'PACCAR engine technical documentation (Kenworth/Peterbilt).',
        url: () => 'https://www.paccar.com/support/',
        badge: 'OEM',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      {
        name: 'Eaton Fuller Transmissions',
        desc: 'Service manuals for Eaton Fuller manual and automated transmissions.',
        url: () => 'https://www.eaton.com/us/en-us/catalog/emobility/roadranger-resources.html',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
    ],
  },
  {
    category: 'Free & Community Resources',
    color: 'bg-green-700',
    items: [
      {
        name: 'iATN (Auto Tech Network)',
        desc: 'Professional technician community with repair case studies.',
        url: () => 'https://www.iatn.net/',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
      {
        name: 'NHTSA Technical Service Bulletins',
        desc: 'Official TSBs and safety recalls by VIN.',
        url: (v) => v.vin
          ? `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${v.vin}?format=json`
          : 'https://www.nhtsa.gov/vehicle-safety/recalls',
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
      },
      {
        name: 'YouTube — Truck Repair',
        desc: `Search visual repair tutorials for ${[]}this vehicle.`,
        url: (v) => `https://www.youtube.com/results?search_query=${encodeURIComponent([v.year, v.make, v.model, 'repair manual'].filter(Boolean).join(' '))}`,
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
        icon: Youtube,
      },
      {
        name: 'Google — Service Manual PDF',
        desc: 'Search for free downloadable service manuals online.',
        url: (v) => `https://www.google.com/search?q=${encodeURIComponent([v.year, v.make, v.model, 'service manual PDF free'].filter(Boolean).join(' '))}`,
        badge: 'FREE',
        badgeColor: 'bg-green-100 text-green-700',
        icon: Globe,
      },
    ],
  },
];

export default function RepairManualsPanel({ vehicle, onClose }) {
  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || `Unit #${vehicle.unit_number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-black text-base">Repair Manuals</div>
              <div className="text-slate-400 text-xs">Unit #{vehicle.unit_number} — {title}</div>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* VIN / info bar */}
        {(vehicle.vin || vehicle.year) && (
          <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-4 text-xs text-blue-700">
            <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {vehicle.year && <span className="font-semibold mr-2">{vehicle.year}</span>}
              {vehicle.make && <span className="mr-2">{vehicle.make}</span>}
              {vehicle.model && <span className="mr-2">{vehicle.model}</span>}
              {vehicle.vin && <span className="font-mono text-blue-500">VIN: {vehicle.vin}</span>}
            </span>
            <span className="ml-auto text-blue-400">Links open pre-filtered to this vehicle where supported</span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {MANUAL_SOURCES.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-5 rounded-full ${section.color}`} />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{section.category}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon || ExternalLink;
                  return (
                    <a
                      key={item.name}
                      href={item.url(vehicle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}>{item.badge}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{item.desc}</div>
                      </div>
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
          Some resources require a subscription. Free sources are marked <span className="font-bold text-green-600">FREE</span>.
        </div>
      </div>
    </div>
  );
}