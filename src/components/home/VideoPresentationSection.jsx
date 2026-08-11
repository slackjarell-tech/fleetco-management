import React from 'react';
import { Play, Download, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLIENT_DECK_DOWNLOAD, CLIENT_VIDEO_URL } from '@/lib/brand';
import DriverAppDownload from '@/components/shared/DriverAppDownload';

export default function VideoPresentationSection() {
  return (
    <section id="platform-tour" className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm tracking-widest uppercase mb-3">
            <Sparkles className="w-4 h-4" /> Platform Tour
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
            See FleetCo in three minutes
          </h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            A guided walkthrough of the website, executive portal, and driver app — narrated for fleet owners who want the full picture before they sign up.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-black/40 bg-black ring-1 ring-white/5">
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

        <p className="text-center text-slate-500 text-xs mt-4 max-w-lg mx-auto">
          Turn up your speakers — the tour uses a clear voiceover so you can follow along while you work.
        </p>

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
