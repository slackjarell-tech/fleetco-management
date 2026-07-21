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
          <a href={BRAND.url}>{BRAND.website}</a>. This Privacy Policy explains how we collect, use, store, and protect
          information when you use our public website, customer portal, and the <strong>FleetCo Driver</strong> mobile app
          (Android and iOS).
        </p>

        <h2>Scope</h2>
        <p>This policy applies to:</p>
        <ul>
          <li><strong>Website</strong> — marketing pages, contact forms, and public content at {BRAND.website}.</li>
          <li><strong>Customer portal</strong> — the FleetCo Management web application used by fleet owners, dispatchers, and administrators.</li>
          <li><strong>FleetCo Driver app</strong> — the mobile app for drivers (package name <code>org.fleetcomanagement.driver</code>) used for time clock, load updates, navigation, and field operations.</li>
        </ul>

        <h2>Information we collect</h2>

        <h3>Account & profile data</h3>
        <ul>
          <li>Name, email address, phone number, company name, job role, and login credentials.</li>
          <li>Profile settings and notification preferences.</li>
        </ul>

        <h3>Fleet & operations data</h3>
        <p>
          Data you or your organization enters or generates through the portal or driver app, including vehicles, VINs,
          drivers, loads, fuel logs, maintenance records, documents, payroll-related entries, time-clock records,
          delivery status, and compliance reports.
        </p>

        <h3>Payment data</h3>
        <p>
          Subscription billing is processed by Stripe. We receive billing contact information and subscription status;
          we do not store full credit or debit card numbers on our servers.
        </p>

        <h3>Usage & device data</h3>
        <ul>
          <li>Pages visited, features used, and portal activity for security, troubleshooting, and product improvement.</li>
          <li>Device type, operating system, browser or app version, IP address, and general diagnostic logs.</li>
          <li>Crash reports and performance data when available through platform services.</li>
        </ul>

        <h3>Communications</h3>
        <p>Messages you send through contact forms, support email, SMS where enabled, or in-app messaging.</p>

        <h2>FleetCo Driver app — location & camera</h2>
        <p>
          The FleetCo Driver app requests certain device permissions so your fleet can operate safely and efficiently.
          You may deny permissions, but some features will not work without them.
        </p>

        <h3>Location (GPS)</h3>
        <ul>
          <li>
            <strong>When collected:</strong> While you are clocked in on an active shift, the app may collect precise
            location (latitude, longitude, accuracy, speed, and heading) approximately every 30 seconds.
          </li>
          <li>
            <strong>Why:</strong> To show driver position on the Fleet Map and Route Dashboard, support dispatch and
            navigation, attach location to fuel logs and delivery updates, and help fleet administrators monitor active routes.
          </li>
          <li>
            <strong>Who sees it:</strong> Location data is shared with authorized users in your organization (e.g., dispatchers
            and fleet managers) through the customer portal. We do not sell location data.
          </li>
          <li>
            <strong>When it stops:</strong> Location tracking tied to shifts stops when you clock out. You can also revoke
            location permission in your device settings at any time.
          </li>
        </ul>

        <h3>Camera</h3>
        <ul>
          <li>
            <strong>When used:</strong> When you choose to capture photos (e.g., dashcam snapshots, proof-of-delivery images)
            or scan barcodes for inventory and load verification.
          </li>
          <li>
            <strong>Why:</strong> To document deliveries, vehicle condition, fuel receipts, and parts; and to record barcode
            scans linked to your fleet records.
          </li>
          <li>
            <strong>Storage:</strong> Photos and scan results are uploaded to your organization&apos;s FleetCo account and
            visible to authorized portal users. Images are not used for advertising.
          </li>
        </ul>

        <h3>Other mobile permissions</h3>
        <ul>
          <li><strong>Internet & network state</strong> — required to sync data with the FleetCo platform.</li>
          <li><strong>Notifications</strong> — optional alerts for load assignments, messages, and schedule reminders (if enabled).</li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide, operate, and improve the FleetCo website, customer portal, and driver app.</li>
          <li>Authenticate users and enforce role-based access within your organization.</li>
          <li>Generate reports, compliance records, and operational analytics for your fleet.</li>
          <li>Display real-time driver location and operational status to authorized fleet personnel.</li>
          <li>Respond to support requests and send service-related notices (account, billing, security).</li>
          <li>Process subscriptions, prevent fraud, and protect the security of our systems.</li>
          <li>Comply with legal obligations and enforce our <Link to="/terms">Terms of Service</Link>.</li>
        </ul>

        <h2>How we share information</h2>
        <p>
          We do <strong>not</strong> sell your personal information. We may share data in these limited circumstances:
        </p>
        <ul>
          <li>
            <strong>Within your organization</strong> — portal users see data according to their assigned role (e.g., dispatchers
            see driver locations; drivers see their assigned loads).
          </li>
          <li>
            <strong>Service providers</strong> — trusted vendors who help us operate the platform (cloud hosting, email delivery,
            payment processing, analytics) under confidentiality and data-processing obligations.
          </li>
          <li>
            <strong>Legal requirements</strong> — when required by law, regulation, legal process, or to protect the rights,
            safety, and security of FleetCo, our customers, or the public.
          </li>
          <li>
            <strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets, with notice
            where required by law.
          </li>
        </ul>

        <h2>Data retention & security</h2>
        <p>
          We retain account and fleet data while your subscription is active and as needed for legal, tax, DOT compliance,
          and contractual purposes. Location history and operational records may be retained according to your organization&apos;s
          settings and applicable regulations.
        </p>
        <p>
          We use industry-standard safeguards including encrypted transport (HTTPS/TLS), access controls, authentication,
          and tenant isolation between customer organizations. No method of transmission or storage is 100% secure; contact us
          immediately if you suspect unauthorized access to your account.
        </p>

        <h2>Your choices & rights</h2>
        <ul>
          <li>Update account details through the portal or by contacting support.</li>
          <li>Manage mobile permissions (location, camera) in your device settings.</li>
          <li>Request export or deletion of your organization&apos;s data by emailing <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.</li>
          <li>Drivers and team members should contact their fleet administrator for role or access changes.</li>
          <li>California residents may have additional rights under the CCPA; contact us to exercise applicable rights.</li>
        </ul>

        <h2>Children&apos;s privacy</h2>
        <p>
          FleetCo services are intended for business use and are not directed to children under 13. We do not knowingly
          collect personal information from children. If you believe a child has provided us data, contact us and we will
          delete it.
        </p>

        <h2>International users</h2>
        <p>
          FleetCo is based in the United States. If you access our services from outside the U.S., your information may be
          processed and stored in the U.S. or other countries where our service providers operate.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the
          &quot;Last updated&quot; date. Continued use of our services after changes constitutes acceptance of the updated policy.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or our data practices:
        </p>
        <ul>
          <li>Email: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></li>
          <li>Phone: {BRAND.phone}</li>
          <li>Address: {LEGAL.company}, {BRAND.location}</li>
        </ul>
        <p>
          See also our <Link to="/terms">Terms of Service</Link>.
        </p>
      </article>

      <FooterSection />
    </div>
  );
}
