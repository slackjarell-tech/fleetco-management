import React from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import MarketingAiWidget from '@/components/marketing/MarketingAiWidget';

export default function MarketingShell({ title, description, path, children, darkHero = false }) {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta title={title} description={description} path={path} />
      <NavBar />
      {children}
      <FooterSection />
      <MarketingAiWidget />
    </div>
  );
}

export function MarketingHero({ badge, title, subtitle, children, dark = true }) {
  return (
    <section className={`pt-24 pb-14 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        {badge && (
          <span className={`inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 ${dark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800'}`}>
            {badge}
          </span>
        )}
        <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">{title}</h1>
        {subtitle && <p className={`text-lg max-w-2xl mx-auto ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>}
        {children && <div className="flex flex-wrap justify-center gap-3 mt-8">{children}</div>}
      </div>
    </section>
  );
}
