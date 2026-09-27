import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const TermsPage: React.FC = () => {
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';

  useSEO({
    title: 'Terms of Service',
    description: 'Read the Terms of Service governing the use of ShopManu, including menu price accuracy disclaimers and restaurant owner obligations.',
    canonicalUrl: `${seoOrigin}/terms`,
    ogType: 'article',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Terms of Service
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
            1. Acceptance & Agreement
          </h2>
          <p>
            By accessing or utilizing the ShopManu platform (the &quot;Platform&quot;), operated by <em>[ShopManu Legal Entity / Company Name]</em> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree to these terms, you must refrain from using the Platform.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            2. Platform Purpose & Scope
          </h2>
          <p>
            ShopManu is an informational food and restaurant discovery directory designed to help dining customers find genuine restaurant locations, menus, dish portions, and current pricing. ShopManu is an informational directory and does not take food orders, process financial transactions, or handle food delivery.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            3. Menu Information & Pricing Disclaimers
          </h2>
          <p>
            Restaurant listings, categories, food descriptions, portion sizes, prices, and operating hours are maintained directly by restaurant owners or verified establishment representatives.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li><strong>Subject to Change:</strong> Restaurant menus, ingredient availability, and prices may change at the physical establishment without prior notice to ShopManu.</li>
            <li><strong>Freshness Transparency:</strong> To provide honest guidance, the Platform publishes the exact date and timestamp when prices or menu items were last updated (e.g., <em>&quot;Price updated 14 days ago&quot;</em>).</li>
            <li><strong>No Absolute Price Guarantee:</strong> While we enforce strict anti-fraud rules for owners, ShopManu does not guarantee that physical dine-in or takeout prices will always match the platform with zero discrepancy. In case of discrepancies, the restaurant&apos;s physical register pricing governs.</li>
            <li><strong>Correction & Reporting:</strong> Customers and visitors are encouraged to use the &quot;Report Dish Issue&quot; or &quot;Report Incorrect Information&quot; actions to alert administrators to out-of-date pricing.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            4. Restaurant Owner Responsibilities
          </h2>
          <p>
            Restaurant owners registered on ShopManu represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>They have the legal authority to represent the listed food establishment.</li>
            <li>All provided addresses, geographic coordinates, and phone numbers are authentic and accurate.</li>
            <li>Dishes, vegetarian/non-vegetarian classifications, and variant pricing reflect genuine operational menus.</li>
            <li>Uploaded photographs depict genuine dishes prepared by or associated with their establishment and do not infringe upon intellectual property rights.</li>
          </ul>
          <p>
            Failure to maintain accurate pricing or intentional submission of misleading listings constitutes grounds for immediate listing suspension or permanent termination.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            5. User Conduct & Reporting Rules
          </h2>
          <p>
            Users agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Submit frivolous, defamatory, or fraudulent reports regarding establishments.</li>
            <li>Attempt to bypass Row Level Security, escalate user roles, or tamper with another owner&apos;s listings.</li>
            <li>Scrape platform content using automated bots in a manner that degrades service availability.</li>
            <li>Upload malicious scripts, corrupted media files, or unauthorized material.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            6. Verification & Administrative Moderation
          </h2>
          <p>
            Newly registered restaurants undergo administrative review before becoming publicly discoverable (transitioning from <code>pending</code> to <code>approved</code>). Platform administrators reserve the unilateral right to suspend, reject, or remove any establishment, menu item, or customer report that violates these terms or poses a risk to platform integrity.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, ShopManu and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from restaurant closures, menu inaccuracies, food preparation quality, or navigation routes provided via third-party mapping services.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-900">
            8. Contact & Legal Inquiries
          </h2>
          <p>
            For questions regarding these Terms or legal notices, please contact:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
            <div><strong>ShopManu Legal Administration:</strong></div>
            <div>Email: <em>[legal@yourdomain.com]</em></div>
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
            to="/privacy"
            className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
};
