import React, { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { api } from '@/api/apiClient';

const fleetSizes = ['1 (Owner Operator)', '2-5 Vehicles', '6-15 Vehicles', '16-50 Vehicles', '50+ Vehicles'];
const services = ['Fleet Management', 'Parts Sourcing', 'Fuel Optimization', 'Safety Coordination', 'Towing & Repair', 'Tax Documentation', 'Full Service Package'];

export default function InquiryForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', fleet_size: '', service_interest: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.functions.invoke('submitInquiry', form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', company: '', fleet_size: '', service_interest: '', message: '' });
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
    }
    setLoading(false);
  };

  return (
    <section id="contact" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Get In Touch</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Request a Free Consultation</h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Tell us about your fleet and we'll reach out within 24 hours to discuss how we can help you save money and reduce downtime.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Inquiry Sent!</h3>
            <p className="text-slate-600">
              Thank you for reaching out. Our team will contact you within 24 hours to discuss your fleet management needs.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@company.com"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Your LLC or business name"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fleet Size</label>
                <select
                  name="fleet_size"
                  value={form.fleet_size}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition bg-white"
                >
                  <option value="">Select fleet size...</option>
                  {fleetSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Interested In</label>
                <select
                  name="service_interest"
                  value={form.service_interest}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition bg-white"
                >
                  <option value="">Select a service...</option>
                  {services.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Tell us about your fleet, current challenges, or what you're looking for..."
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold text-lg py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-5 h-5" /> Send My Inquiry</>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}