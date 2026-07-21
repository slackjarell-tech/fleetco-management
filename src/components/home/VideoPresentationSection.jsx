import React from 'react';
import { Play, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLIENT_DECK_DOWNLOAD, CLIENT_VIDEO_URL } from '@/lib/brand';
import DriverAppDownload from '@/components/shared/DriverAppDownload';

export default function VideoPresentationSection() {
  return (
    <section id="platform-tour" className="py-20 bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">Platform Tour</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
            See FleetCo in Action
          </h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Website, executive portal, and mobile driver app — one platform for your entire operation.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
          <video
            className="w-full aspect-video"
            controls
            playsInline
            preload="metadata"
            poster="/marketing/video-poster.jpg"
          >
            <source src={CLIENT_VIDEO_URL} type="video/mp4" />
            Your browser does not support embedded video.
          </video>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Play className="w-5 h-5" /> Try the Live Portal
          </Link>
          <a
            href={CLIENT_DECK_DOWNLOAD}
            download
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-400 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" /> Download Client Deck (PPTX)
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-slate-500 text-sm">Drivers — get the mobile app</p>
          <DriverAppDownload variant="badges" />
        </div>
      </div>
    </section>
  );
}
