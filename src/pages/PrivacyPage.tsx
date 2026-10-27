import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const PrivacyPage: React.FC = () => {
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';

  useSEO({
    title: 'Privacy Policy',
    description: 'Learn how ManuMania handles in-session customer location, account data, uploaded media, and platform security.',
    canonicalUrl: `${seoOrigin}/privacy`,
    ogType: 'article',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-8 sm:p-12 space-y-8 rounded-sm">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
            LEGAL & PRIVACY DISCLOSURE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-cream-100 tracking-tight">
            Privacy Policy
          </h1>
          <p className="font-mono text-xs text-cream-300/50 mt-2">
            Effective Date: September 2026 | Last Updated: September 2026
          </p>
          <div className="mt-4 p-4 bg-[#181310] border border-cream-200/10 text-xs font-mono text-cream-300/70 leading-relaxed rounded-xs">
            <strong className="text-cream-100">Note for Legal Review:</strong> Information designated in brackets such as <em>[Entity Name]</em> represents organizational data to be customized upon official corporate deployment.
          </div>
        </div>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            1. Platform Identity & Scope
          </h2>
          <p>
            This Privacy Policy governs the collection, use, and protection of information by ManuMania (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by <em>[ManuMania Legal Entity / Company Name]</em>. This platform operates an anonymous public discovery model for dining customers, while providing authenticated management accounts exclusively for verified shop and restaurant owners.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            2. Customer Location & &quot;Near Me&quot; Proximity
          </h2>
          <p>
            When you interact with the &quot;Near Me&quot; discovery feature as a visitor, your browser requests permission to access your device&apos;s geographic coordinates (latitude and longitude).
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-cream-300/60">
            <li><strong className="text-cream-200">No Automatic Prompts:</strong> We never request location permission automatically on page load. Geolocation is prompted exclusively when you click a location-based action (such as &quot;Near Me&quot;).</li>
            <li><strong className="text-cream-200">Minimum Precision Truncation:</strong> Coordinates are intentionally truncated to 3 decimal places (~110-meter neighborhood scale). We never collect sub-meter GPS coordinates that could pinpoint your exact residential address or apartment.</li>
            <li><strong className="text-cream-200">No Account Required:</strong> Customers and visitors freely search and discover nearby dining without creating an account or logging in.</li>
            <li><strong className="text-cream-200">Session-Only Processing:</strong> Your geographic coordinates are held strictly in temporary browser session memory (<code>sessionStorage</code>) while you actively search and are cleared when the browser tab closes.</li>
            <li><strong className="text-cream-200">No Database Persistence:</strong> Customer coordinates are never written to, logged in, or linked with persistent profile records in our PostgreSQL database.</li>
            <li><strong className="text-cream-200">No Continuous Tracking:</strong> We use single-shot positioning only. We never run background location watchers or travel route trackers.</li>
            <li><strong className="text-cream-200">No Exposure to Shop Owners:</strong> Precise customer location is never exposed to restaurant owners, other users, or third-party advertisers.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            3. Shop Owner Account & Registration Data
          </h2>
          <p>
            Registration on ManuMania is exclusively for restaurant and shop owners who wish to list and manage their business menus. When registering as a shop owner, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li>Full Owner / Representative Name</li>
            <li>Business Email Address</li>
            <li>Password (securely salted and hashed via our InsForge backend service; passwords are never visible to or stored in plain text by administrators)</li>
            <li>Contact telephone number</li>
            <li>Account role classification (<code>owner</code>)</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            4. Restaurant Business Information & Media
          </h2>
          <p>
            For restaurant owners, business listings (restaurant name, street address, locality, city, contact telephone, operating hours, categories, dishes, variant prices, and uploaded photographs) are collected specifically for public indexing and discovery. Uploaded food and storefront photographs are stored in isolated cloud object storage (<code>restaurant-media</code> bucket) and made accessible to dining customers.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            5. Customer Reports & Moderation
          </h2>
          <p>
            When submitting a report regarding incorrect menu pricing, establishment closure, or food unavailability, we collect the reported dish/restaurant details, issue category, descriptive notes, and the reporter&apos;s email address. Reports are reviewed by administrators to ensure platform accuracy. Administrative resolution notes remain strictly confidential and internal.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            6. Third-Party Services
          </h2>
          <p>
            We integrate with reputable third-party infrastructure providers necessary to operate the platform:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li><strong className="text-cream-200">InsForge Backend-as-a-Service:</strong> Provides PostgreSQL database hosting, PostGIS spatial indexing, user authentication, and media storage.</li>
            <li><strong className="text-cream-200">Google Maps Platform:</strong> Provides interactive mapping and navigation routing for approved establishments. Subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">Google Privacy Policy</a>.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            7. Zero Tracking Policy & Browser Storage
          </h2>
          <p>
            ManuMania is built with a privacy-first architecture. We do not use tracking cookies, advertising beacons, canvas fingerprinting, keystroke trackers, or session recording scripts. Browser storage is utilized strictly for essential operational needs:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li><strong className="text-cream-200">Authentication Tokens:</strong> Securely stored in browser storage exclusively for authenticated restaurant owners and administrators.</li>
            <li><strong className="text-cream-200">Session Location:</strong> Stored in <code>sessionStorage</code> only during active search sessions and wiped when the tab closes.</li>
            <li><strong className="text-cream-200">No Deceptive Consent Banners:</strong> Because we do not deploy non-essential tracking cookies or third-party marketing trackers, we do not burden visitors with deceptive or coercive cookie consent popups.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            8. Data Security & Technical Safeguards
          </h2>
          <p>
            Rather than relying on vague marketing buzzwords, we enforce defense-in-depth engineering practices to safeguard data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li><strong className="text-cream-200">Database-Level Row Level Security (RLS):</strong> Permissions and tenant isolation are enforced at the PostgreSQL database layer, not merely on the client interface.</li>
            <li><strong className="text-cream-200">Cross-Tenant Protection:</strong> Shop owners can only query and mutate records belonging to their authenticated owner identity. URL or ID parameter tampering is strictly blocked.</li>
            <li><strong className="text-cream-200">No Plaintext Passwords:</strong> Passwords are cryptographically salted and hashed via bcrypt before storage and are never retrievable by administrators.</li>
            <li><strong className="text-cream-200">Protected APIs & Secrets:</strong> Secret server keys and database credentials are kept strictly server-side. Public APIs expose only the minimum columns required for dining discovery.</li>
            <li><strong className="text-cream-200">Sanitized Error Handling:</strong> Error outputs are sanitized to prevent disclosing internal SQL queries, table schemas, stack traces, or server directory paths.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            9. Your Rights & Inquiries
          </h2>
          <p>
            Depending on your jurisdiction, you have the right to access, rectify, or request deletion of your personal account information. For inquiries, please contact:
          </p>
          <div className="p-4 bg-[#181310] border border-cream-200/10 font-mono text-xs text-cream-300/70 rounded-xs">
            <div><strong className="text-amber-300">ManuMania Data Protection & Privacy Contact:</strong></div>
            <div>Email: <em className="text-cream-200">privacy@shopmanu.com</em></div>
            <div>Physical Address: <em>[Registered Corporate Office, Kolkata, India]</em></div>
          </div>
        </section>

        <div className="pt-6 border-t border-cream-200/10 flex items-center justify-between font-mono text-xs">
          <Link
            to="/"
            className="text-amber-400 hover:text-amber-300 uppercase tracking-wider underline"
          >
            ← Back to Home
          </Link>
          <Link
            to="/terms"
            className="text-cream-300/50 hover:text-cream-200 uppercase tracking-wider underline"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
};
