import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import { FileText } from 'lucide-react';
import { BRAND, LEGAL } from '@/lib/brand';

export default function Terms() {
  const updated = 'July 20, 2026';

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <section className="pt-24 pb-12 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-5">
            <FileText className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: {updated}</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-slate prose-headings:font-black">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of the FleetCo Management platform and related services provided by {LEGAL.company}. By creating an account, subscribing, or using the portal, you agree to these Terms.
        </p>

        <h2>Service description</h2>
        <p>
          FleetCo provides a cloud-based fleet operations platform (portal and driver tools) and optional managed fleet services such as parts sourcing, fuel optimization, and repair coordination. Subscription plans include portal access; hands-on managed services may vary by plan tier as described on our pricing page.
        </p>

        <h2>Accounts & access</h2>
        <ul>
          <li>You are responsible for safeguarding login credentials and for activity under your account.</li>
          <li>Customer owners may invite team members and drivers; you control their roles and permissions.</li>
          <li>You must provide accurate business and contact information.</li>
        </ul>

        <h2>Acceptable use</h2>
        <p>You agree not to misuse the platform, attempt unauthorized access, upload malicious content, or use FleetCo in violation of applicable law or DOT regulations.</p>

        <h2>Subscriptions & billing</h2>
        <ul>
          <li>Paid plans renew monthly or annually as selected at checkout unless cancelled.</li>
          <li>Prices are listed on <Link to="/#pricing">our pricing page</Link> and may change with notice for future billing periods.</li>
          <li>Refunds are handled case-by-case; contact <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.</li>
        </ul>

        <h2>Your data</h2>
        <p>
          You retain ownership of fleet and business data you enter. You grant FleetCo a license to host, process, and display that data solely to provide the service. See our <Link to="/privacy">Privacy Policy</Link> for details.
        </p>

        <h2>Intellectual property</h2>
        <p>{LEGAL.patentNotice} The FleetCo name, logo, software, and documentation are owned by {LEGAL.company}.</p>

        <h2>Disclaimer & limitation</h2>
        <p>
          The platform is provided &quot;as is.&quot; FleetCo does not guarantee uninterrupted service or specific financial outcomes. To the extent permitted by law, our liability is limited to fees paid in the twelve months preceding a claim.
        </p>

        <h2>Termination</h2>
        <p>
          You may cancel at any time. We may suspend access for non-payment or material breach. Upon termination, you may request export of your data within a reasonable period.
        </p>

        <h2>Governing law</h2>
        <p>These Terms are governed by the laws of the State of Texas. Disputes shall be resolved in Dallas County, Texas, unless otherwise required by law.</p>

        <h2>Contact</h2>
        <p>
          {LEGAL.company} · {BRAND.location} · <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> · {BRAND.phone}
        </p>
      </article>

      <FooterSection />
    </div>
  );
}
