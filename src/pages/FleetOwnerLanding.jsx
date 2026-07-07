import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Phone, Mail, Truck, Shield, Fuel, Wrench, Star, DollarSign, Clock, FileText } from 'lucide-react';
import { api } from '@/api/apiClient';
import SiteLegalNotice from '@/components/home/SiteLegalNotice';

const painPoints = [
  { icon: DollarSign, text: 'Overpaying for fuel and parts with no leverage?' },
  { icon: Wrench, text: 'Trucks breaking down with no support system?' },
  { icon: FileText, text: 'Drowning in paperwork at tax time?' },
  { icon: Clock, text: 'Spending hours managing drivers instead of growing?' },
];

const benefits = [
  { icon: Truck, title: 'Parts Sourcing', desc: 'We locate NBO & aftermarket parts fast — get back on the road in hours, not weeks.' },
  { icon: Fuel, title: 'Fuel Optimization', desc: 'We find the best diesel prices along your routes, saving you thousands per year.' },
  { icon: Shield, title: 'Safety & Compliance', desc: 'Stay DOT compliant with dedicated Safety Coordinators managing your records.' },
  { icon: FileText, title: 'Tax Documentation', desc: 'Full invoice & expense tracking per unit — year-end tax prep done for you.' },
];

const adImages = [
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=628&fit=crop',
    label: 'Facebook / Google Ad (1200×628)',
    size: 'Best for: Facebook, Instagram, Google Display',
    download: 'fleetco-ad-banner.png',
  },
  {
    url: 'https://images.unsplash.com/photo-1519003722464-f07a3759139f?w=1080&h=1080&fit=crop',
    label: 'Instagram Square Ad (1080×1080)',
    size: 'Best for: Instagram Feed, Facebook Feed',
    download: 'fleetco-ad-square.png',
  },
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=728&h=90&fit=crop',
    label: 'Leaderboard Banner Ad (728×90)',
    size: 'Best for: Google Display Network, websites',
    download: 'fleetco-ad-leaderboard.png',
  },
];

export default function FleetOwnerLanding() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', fleet_size: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.functions.invoke('submitInquiry', {
      ...form,
      service_interest: 'Full Service Package',
      message: form.message || `Fleet size: ${form.fleet_size}. Interested in fleet management services.`,
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-body">

      {/* Hero */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1800&q=80")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-300 text-sm font-medium">For Owner Operators & Fleet Managers</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            Stop Losing Money<br />
            <span className="text-amber-400">Running Your Fleet Alone.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            FleetCo Management handles the parts, fuel, compliance, and paperwork — so you can focus on what matters: moving freight and growing your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#get-started"
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg px-10 py-4 rounded-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
            >
              Get a Free Consultation <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="tel:+1-800-FLEETCO"
              className="border-2 border-slate-500 hover:border-amber-400 text-white hover:text-amber-400 font-semibold text-lg px-10 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" /> Call Us Now
            </a>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Sound Familiar?</h2>
          <p className="text-slate-500 mb-10">Most owner operators face these challenges every day. FleetCo solves them all.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {painPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 text-left shadow-sm">
                <div className="bg-red-50 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-slate-700 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">How We Help</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Everything Your Fleet Needs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 border border-slate-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all">
                <div className="bg-amber-50 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {[
              { value: '50+', label: 'Trucks Managed' },
              { value: '$2K+', label: 'Avg Annual Savings/Unit' },
              { value: '24/7', label: 'Emergency Support' },
              { value: '100%', label: 'Documentation Accuracy' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-4xl font-black text-amber-400 mb-1">{s.value}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-2xl mx-auto">
            <div className="flex justify-center mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <p className="text-slate-300 italic mb-4">"FleetCo saved me thousands on parts for my Freightliner. They found an NBO part in 24 hours that I couldn't find anywhere. Kept me on the road instead of sitting in a shop for 3 weeks."</p>
            <div className="text-white font-bold text-sm">Marcus T. — Owner Operator, Dallas TX</div>
          </div>
        </div>
      </section>

      {/* Lead Form */}
      <section id="get-started" className="py-16 bg-amber-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Free Consultation</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Let's Talk About Your Fleet</h2>
            <p className="text-slate-500 mt-2">No commitment. Just a conversation about how we can save you time and money.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-lg border border-amber-200">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">We'll Be In Touch!</h3>
              <p className="text-slate-500">Thanks for reaching out. A FleetCo team member will contact you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="john@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="(214) 555-0100" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fleet Size</label>
                  <select value={form.fleet_size} onChange={e => setForm({...form, fleet_size: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                    <option value="">Select fleet size</option>
                    <option>1 (Owner Operator)</option>
                    <option>2-5 Vehicles</option>
                    <option>6-15 Vehicles</option>
                    <option>16-50 Vehicles</option>
                    <option>50+ Vehicles</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">What's your biggest challenge?</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 h-24 resize-none"
                  placeholder="Tell us about your fleet challenges..." />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg py-4 rounded-lg transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                {loading ? 'Sending...' : (<>Get My Free Consultation <ArrowRight className="w-5 h-5" /></>)}
              </button>
              <p className="text-center text-slate-400 text-xs">No spam. No commitment. Just honest fleet advice.</p>
            </form>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 text-sm text-slate-500">
            <a href="mailto:info@fleetcomanagement.com" className="flex items-center gap-2 hover:text-amber-600">
              <Mail className="w-4 h-4" /> info@fleetcomanagement.com
            </a>
            <a href="tel:+12145550100" className="flex items-center gap-2 hover:text-amber-600">
              <Phone className="w-4 h-4" /> (214) 555-0100
            </a>
          </div>
        </div>
      </section>

      {/* Ad Creatives Download */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Ad Creatives</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Ready-to-Use Ad Images</h2>
            <p className="text-slate-500 mt-2">Download these and upload directly to Google Ads, Facebook Ads, or Instagram.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adImages.map(ad => (
              <div key={ad.label} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <img src={ad.url} alt={ad.label} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="font-bold text-slate-900 text-sm mb-1">{ad.label}</div>
                  <div className="text-slate-500 text-xs mb-3">{ad.size}</div>
                  <a
                    href={ad.url}
                    download={ad.download}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Ad Copy */}
          <div className="mt-12 bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">Ready-to-Use Ad Copy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  platform: 'Google Search Ad',
                  headline: 'Fleet Management for Truckers | Save $2K+ Per Truck Per Year',
                  body: 'FleetCo handles parts, fuel, compliance & paperwork so you can focus on the road. Free consultation. Dallas, TX.',
                },
                {
                  platform: 'Facebook/Instagram Ad',
                  headline: 'Owner Operators: Stop Overpaying for Parts & Fuel',
                  body: 'FleetCo Management finds NBO parts in 24 hrs, optimizes your fuel costs, and keeps you DOT compliant. Get a free fleet audit today.',
                },
                {
                  platform: 'LinkedIn Ad',
                  headline: 'Fleet Management Built for Small Carriers',
                  body: 'Reduce operating costs, stay compliant, and scale your fleet with FleetCo Management LLC. Serving owner operators nationwide.',
                },
                {
                  platform: 'Instagram Story',
                  headline: 'Is your fleet costing you too much? 🚛',
                  body: 'FleetCo Management saves owner operators $2K+ per truck per year on parts, fuel & compliance. Swipe up for a free consultation.',
                },
              ].map(c => (
                <div key={c.platform} className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">{c.platform}</div>
                  <div className="font-bold text-slate-900 text-sm mb-2">"{c.headline}"</div>
                  <div className="text-slate-500 text-xs leading-relaxed">{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 px-4 text-sm space-y-2">
        <SiteLegalNotice className="text-slate-400 text-sm" />
        <p className="text-slate-600 text-xs">Dallas, TX | Licensed &amp; Insured</p>
      </footer>
    </div>
  );
}