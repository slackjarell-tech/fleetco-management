import React, { useState } from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/apiClient';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.functions.invoke('submitInquiry', {
        name: form.name,
        email: form.email,
        company: form.company,
        fleet_size: 'Not specified',
        service_interest: 'General Inquiry',
        message: form.message
      });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-6">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6">Contact Us</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Ready to streamline your fleet operations? Reach out and we'll get back to you within one business day.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Send Us a Message</h2>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-green-800 font-bold text-lg mb-2">Message Sent!</h3>
                <p className="text-green-700">We'll get back to you within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                  <Input
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
                  <Input
                    placeholder="Your company name"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Message *</label>
                  <Textarea
                    required
                    placeholder="Tell us about your fleet and what you're looking for..."
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Our Location</h3>
                  <p className="text-slate-600">Dallas, Texas</p>
                  <p className="text-slate-500 text-sm">Serving carriers nationwide</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Email</h3>
                  <a href="mailto:support@fleetcomanagement.org" className="text-amber-600 hover:text-amber-500 font-medium">
                    support@fleetcomanagement.org
                  </a>
                  <p className="text-slate-500 text-sm mt-1">We respond within one business day</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Phone</h3>
                  <p className="text-slate-600">Call for immediate inquiries</p>
                  <p className="text-slate-500 text-sm">Available weekdays 8 AM – 6 PM CT</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="font-bold text-slate-900 mb-3">Our Leadership</h3>
                <div className="space-y-2">
                  <div className="text-slate-700">
                    <span className="font-semibold">JaRell D. Slack</span>
                    <span className="text-slate-500 block text-sm">Owner, Director of Fleet Management</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Desiree M. Clark</span>
                    <span className="text-slate-500 block text-sm">Co-Owner, Director of Operations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}