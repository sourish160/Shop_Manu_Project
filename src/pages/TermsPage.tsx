import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const TermsPage: React.FC = () => {
  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';

  useSEO({
    title: 'Terms of Service',
    description: 'Read the Terms of Service governing the use of ManuMania, including menu price accuracy disclaimers and restaurant owner obligations.',
    canonicalUrl: `${seoOrigin}/terms`,
    ogType: 'article',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="editorial-card bg-[#120E0C] border border-cream-200/10 p-8 sm:p-12 space-y-8 rounded-sm">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
            USER AGREEMENT & CONDITIONS
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-cream-100 tracking-tight">
            Terms of Service
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
            1. Acceptance & Agreement
          </h2>
          <p>
            By accessing or utilizing the ManuMania platform (the &quot;Platform&quot;), operated by <em>[ManuMania Legal Entity / Company Name]</em> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree to these terms, you must refrain from using the Platform.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            2. Platform Purpose & Scope
          </h2>
          <p>
            ManuMania is an informational food and restaurant discovery directory designed to help dining customers find genuine restaurant locations, menus, dish portions, and current pricing. ManuMania is an informational directory and does not take food orders, process financial transactions, or handle food delivery.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            3. Menu Information & Pricing Disclaimers
          </h2>
          <p>
            Restaurant listings, categories, food descriptions, portion sizes, prices, and operating hours are maintained directly by restaurant owners or verified establishment representatives.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li><strong className="text-cream-200">Subject to Change:</strong> Restaurant menus, ingredient availability, and prices may change at the physical establishment without prior notice to ManuMania.</li>
            <li><strong className="text-cream-200">Freshness Transparency:</strong> To provide honest guidance, the Platform publishes the exact date and timestamp when prices or menu items were last updated (e.g., <em>&quot;Price updated 14 days ago&quot;</em>).</li>
            <li><strong className="text-cream-200">No Absolute Price Guarantee:</strong> While we enforce strict anti-fraud rules for owners, ManuMania does not guarantee that physical dine-in or takeout prices will always match the platform with zero discrepancy. In case of discrepancies, the restaurant&apos;s physical register pricing governs.</li>
            <li><strong className="text-cream-200">Correction & Reporting:</strong> Customers and visitors are encouraged to use the &quot;Report Dish Issue&quot; or &quot;Report Incorrect Information&quot; actions to alert administrators to out-of-date pricing.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            4. Restaurant Owner Responsibilities
          </h2>
          <p>
            Restaurant owners registered on ManuMania represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li>They have the legal authority to represent the listed food establishment.</li>
            <li>All provided addresses, geographic coordinates, and phone numbers are authentic and accurate.</li>
            <li>Dishes, vegetarian/non-vegetarian classifications, and variant pricing reflect genuine operational menus.</li>
            <li>Uploaded photographs depict genuine dishes prepared by or associated with their establishment and do not infringe upon intellectual property rights.</li>
          </ul>
          <p>
            Failure to maintain accurate pricing or intentional submission of misleading listings constitutes grounds for immediate listing suspension or permanent termination.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            5. User Conduct & Reporting Rules
          </h2>
          <p>
            Users agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-cream-300/60">
            <li>Submit frivolous, defamatory, or fraudulent reports regarding establishments.</li>
            <li>Attempt to bypass Row Level Security, escalate user roles, or tamper with another owner&apos;s listings.</li>
            <li>Scrape platform content using automated bots in a manner that degrades service availability.</li>
            <li>Upload malicious scripts, corrupted media files, or unauthorized material.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            6. Verification & Administrative Moderation
          </h2>
          <p>
            Newly registered restaurants undergo administrative review before becoming publicly discoverable (transitioning from <code>pending</code> to <code>approved</code>). Platform administrators reserve the unilateral right to suspend, reject, or remove any establishment, menu item, or customer report that violates these terms or poses a risk to platform integrity.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, ManuMania and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from restaurant closures, menu inaccuracies, food preparation quality, or navigation routes provided via third-party mapping services.
          </p>
        </section>

        <section className="space-y-3 text-sm text-cream-300/80 leading-relaxed">
          <h2 className="font-serif text-lg font-medium text-cream-100">
            8. Contact & Legal Inquiries
          </h2>
          <p>
            For questions regarding these Terms or legal notices, please contact:
          </p>
          <div className="p-4 bg-[#181310] border border-cream-200/10 font-mono text-xs text-cream-300/70 rounded-xs">
            <div><strong className="text-amber-300">ManuMania Legal Administration:</strong></div>
            <div>Email: <em className="text-cream-200">legal@shopmanu.com</em></div>
            <div>Physical Address: <em>[Registered Business Address / Corporate Office]</em></div>
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
            to="/privacy"
            className="text-cream-300/50 hover:text-cream-200 uppercase tracking-wider underline"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
};
