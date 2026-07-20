import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import { Shield } from 'lucide-react';
import { BRAND, LEGAL } from '@/lib/brand';

export default function Privacy() {
  const updated = 'July 20, 2026';

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <section className="pt-24 pb-12 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-5">
            <Shield className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {updated}</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-slate prose-headings:font-black">
        <p>
          {LEGAL.company} (&quot;FleetCo,&quot; &quot;we,&quot; &quot;us&quot;) operates the FleetCo Management platform at{' '}
          <a href={BRAND.url}>{BRAND.website}</a>. This policy explains how we collect, use, and protect information when you use our website, client portal, and driver mobile experience.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email, company, role, and login credentials.</li>
          <li><strong>Fleet & operations data:</strong> vehicles, VINs, drivers, loads, fuel logs, maintenance records, documents, and payroll-related entries you enter in the portal.</li>
          <li><strong>Payment data:</strong> subscription billing is processed by Stripe. We do not store full card numbers on our servers.</li>
          <li><strong>Usage data:</strong> pages visited, device/browser type, and portal activity for security and product improvement.</li>
          <li><strong>Communications:</strong> messages you send through contact forms, support email, or in-app messaging.</li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide and maintain the FleetCo platform and managed fleet services.</li>
          <li>Authenticate users and enforce role-based access within your organization.</li>
          <li>Generate reports, compliance records, and operational analytics for your fleet.</li>
          <li>Respond to support requests and send service-related notices.</li>
          <li>Process subscriptions and prevent fraud or abuse.</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We may share data with service providers who help us operate the platform (hosting, email delivery, payment processing) under confidentiality obligations, or when required by law.
        </p>

        <h2>Data retention & security</h2>
        <p>
          We retain account and fleet data while your subscription is active and as needed for legal, tax, and compliance purposes. We use industry-standard safeguards including encrypted transport (HTTPS), access controls, and tenant isolation between customer organizations.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Update account details through the portal or by contacting support.</li>
          <li>Request export or deletion of your organization&apos;s data by emailing <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.</li>
          <li>Drivers and team members should contact their fleet administrator for access changes.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> · {BRAND.phone} · {BRAND.location}
        </p>
        <p>
          See also our <Link to="/terms">Terms of Service</Link>.
        </p>
      </article>

      <FooterSection />
    </div>
  );
}
