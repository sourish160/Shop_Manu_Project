import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const PrivacyPage: React.FC = () => {
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';

  useSEO({
    title: 'Privacy Policy',
    description: 'Learn how ShopManu handles in-session customer location, account data, uploaded media, and platform security.',
    canonicalUrl: `${seoOrigin}/privacy`,
    ogType: 'article',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Effective Date: September 2026 | Last Updated: September 2026
          </p>
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
            <strong>Note for Legal Review:</strong> Information designated in brackets such as <em>[Entity Name]</em> represents organizational data to be customized upon official corporate deployment.
          </div>
        </div>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            1. Platform Identity & Scope
          </h2>
          <p>
            This Privacy Policy governs the collection, use, and protection of information by ShopManu (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by <em>[ShopManu Legal Entity / Company Name]</em>. This platform operates an anonymous public discovery model for dining customers, while providing authenticated management accounts exclusively for verified shop and restaurant owners.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            2. Customer Location & &quot;Near Me&quot; Proximity
          </h2>
          <p>
            When you interact with the &quot;Near Me&quot; discovery feature as a visitor, your browser requests permission to access your device&apos;s geographic coordinates (latitude and longitude).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>No Account Required:</strong> Customers and visitors freely search and discover nearby dining without creating an account or logging in.</li>
            <li><strong>Session-Only Processing:</strong> Your geographic coordinates are held strictly in temporary browser session memory (<code>sessionStorage</code>) while you actively search.</li>
            <li><strong>No Database Persistence:</strong> Customer coordinates are never written to, stored in, or linked with persistent profile records in our PostgreSQL database.</li>
            <li><strong>No Tracking or Profiling:</strong> We do not track user travel history, compile behavioral location profiles, or sell location data to third-party advertisers.</li>
            <li><strong>Revocation:</strong> You can revoke location permissions at any time via your browser or mobile device operating system settings.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            3. Shop Owner Account & Registration Data
          </h2>
          <p>
            Registration on ShopManu is exclusively for restaurant and shop owners who wish to list and manage their business menus. When registering as a shop owner, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Full Owner / Representative Name</li>
            <li>Business Email Address</li>
            <li>Password (securely salted and hashed via our InsForge backend service; passwords are never visible to or stored in plain text by administrators)</li>
            <li>Contact telephone number</li>
            <li>Account role classification (<code>owner</code>)</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            4. Restaurant Business Information & Media
          </h2>
          <p>
            For restaurant owners, business listings (restaurant name, street address, locality, city, contact telephone, operating hours, categories, dishes, variant prices, and uploaded photographs) are collected specifically for public indexing and discovery. Uploaded food and storefront photographs are stored in isolated cloud object storage (<code>restaurant-media</code> bucket) and made accessible to dining customers.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            5. Customer Reports & Moderation
          </h2>
          <p>
            When submitting a report regarding incorrect menu pricing, establishment closure, or food unavailability, we collect the reported dish/restaurant details, issue category, descriptive notes, and the reporter&apos;s email address. Reports are reviewed by administrators to ensure platform accuracy. Administrative resolution notes remain strictly confidential and internal.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            6. Third-Party Services
          </h2>
          <p>
            We integrate with reputable third-party infrastructure providers necessary to operate the platform:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>InsForge Backend-as-a-Service:</strong> Provides PostgreSQL database hosting, PostGIS spatial indexing, user authentication, and media storage.</li>
            <li><strong>Google Maps Platform:</strong> Provides interactive mapping and navigation routing for approved establishments. Subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900">Google Privacy Policy</a>.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            7. Cookies & Local Browser Storage
          </h2>
          <p>
            ShopManu does not use tracking or advertising cookies. Browser storage is used strictly for essential functional operations:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>Authentication Tokens:</strong> Stored securely to preserve login state across navigation.</li>
            <li><strong>Session Location:</strong> Stored in <code>sessionStorage</code> to preserve active Near Me filters during your current browser tab session.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            8. Data Security & Retention
          </h2>
          <p>
            We implement Row Level Security (RLS) policies, SSL/TLS transport encryption, and immutable audit logging for administrative actions. We retain account records as long as your account remains active. Restaurant owners may request removal of their establishment or deletion of their account by contacting platform administration.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            9. Your Rights & Inquiries
          </h2>
          <p>
            Depending on your jurisdiction, you have the right to access, rectify, or request deletion of your personal account information. For inquiries, please contact:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
            <div><strong>ShopManu Data Protection & Privacy Contact:</strong></div>
            <div>Email: <em>[privacy@yourdomain.com]</em></div>
            <div>Physical Address: <em>[Registered Business Address / Corporate Office]</em></div>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-900 hover:underline"
          >
            ← Back to Home
          </Link>
          <Link
            to="/terms"
            className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
};
