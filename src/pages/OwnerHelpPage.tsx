import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import { useSEO } from '../hooks/useSEO';
import {
  HelpCircle,
  BookOpen,
  UtensilsCrossed,
  DollarSign,
  Store,
  Camera,
  Mail,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react';

export const OwnerHelpPage: React.FC = () => {
  useSEO({
    title: 'Help & Support — ManuMania Restaurant Partner Platform',
    noIndex: true,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'getting-started' | 'menu' | 'pricing' | 'profile' | 'images' | 'support'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const guides = [
    {
      id: 'getting-started',
      category: 'getting-started',
      title: 'Getting Started with ManuMania',
      icon: BookOpen,
      summary: 'Learn how to register your kitchen, configure initial operating hours, and publish your digital menu.',
      steps: [
        'Complete your Restaurant Profile with accurate physical address, phone, and cuisine tags.',
        'Upload your restaurant logo and high-quality storefront cover photo.',
        'Configure your operating hours for all 7 days so customers know when your kitchen is open.',
        'Create menu categories (e.g. Starters, Main Course, Biryani, Beverages).',
        'Add at least 3 to 5 signature dishes with verified prices to submit for verification.',
      ],
      quickLink: '/owner/restaurant',
      quickLinkLabel: 'Go to Restaurant Profile',
    },
    {
      id: 'menu',
      category: 'menu',
      title: 'How to Manage Menu Items & Categories',
      icon: UtensilsCrossed,
      summary: 'Add new dishes, organize by category, toggle availability, and edit descriptions.',
      steps: [
        'Navigate to "Menu Management" from the sidebar.',
        'Click "+ Add Food Item" to add a new dish. Enter dish name, category, and veg/non-veg type.',
        'Set item status: "Active" (visible to diners) or "Inactive" (temporarily sold out / unavailable).',
        'To reorder or create categories, use "+ New Category" or "Reorder Categories" buttons.',
        'Use the search bar and category filters to quickly find and edit specific dishes.',
      ],
      quickLink: '/owner/menu',
      quickLinkLabel: 'Manage Menu Items',
    },
    {
      id: 'pricing',
      category: 'pricing',
      title: 'How to Update Food Prices & Variants',
      icon: DollarSign,
      summary: 'Set single flat prices, multi-tier portion variants (Half / Full), and add-on options.',
      steps: [
        'Open the dish edit modal by clicking the pencil icon next to any menu item.',
        'For single-price dishes, set the Base Price in Rupees (₹).',
        'For portion-based dishes, enable "Has Size Variants" and define labels (e.g. Quarter ₹120, Half ₹220, Full ₹380).',
        'Attach custom add-ons (e.g. Extra Raita ₹20, Extra Egg ₹15) under the Add-ons section.',
        'Updating dish prices periodically keeps your Freshness Score high and builds diner trust.',
      ],
      quickLink: '/owner/menu',
      quickLinkLabel: 'Update Dish Prices',
    },
    {
      id: 'profile',
      category: 'profile',
      title: 'How to Manage Restaurant Information & Map Pin',
      icon: Store,
      summary: 'Update contact details, area neighborhood, physical address, and exact Google Maps pin.',
      steps: [
        'Navigate to "Restaurant Profile" from the sidebar.',
        'Update your restaurant name, short bio/story, primary phone number, and neighborhood area.',
        'Click on the interactive map picker to accurately place your kitchen\'s Google Maps pin.',
        'Update daily open and close times or toggle "Closed" on holidays and weekly off days.',
        'Click "Save Restaurant Profile" to update your live public menu directory card.',
      ],
      quickLink: '/owner/restaurant',
      quickLinkLabel: 'Edit Restaurant Profile',
    },
    {
      id: 'images',
      category: 'images',
      title: 'Image Upload Guidelines & Best Practices',
      icon: Camera,
      summary: 'Best resolutions, aspect ratios, lighting recommendations, and supported file formats.',
      steps: [
        'Supported formats: JPG, PNG, WEBP. Maximum file size: 5 MB per image.',
        'Restaurant Cover: Recommended 16:9 widescreen landscape (e.g. 1920 × 1080 px).',
        'Restaurant Logo: Recommended 1:1 square (e.g. 500 × 500 px) with clear background.',
        'Food Dish Photos: Clear close-up overhead or 45-degree angle under warm natural lighting.',
        'Avoid heavy text overlays, watermarks, or artificial filters for higher customer conversion.',
      ],
      quickLink: '/owner/restaurant',
      quickLinkLabel: 'Upload Storefront Photos',
    },
    {
      id: 'support',
      category: 'support',
      title: 'Contact Support & Partner Help Desk',
      icon: Mail,
      summary: 'Direct assistance for verification requests, account queries, and technical support.',
      steps: [
        'Email Support: support@shopmanu.com (Responses within 24 hours on business days).',
        'Verification Badge: If your profile has completed menus and phone, request badge review via email.',
        'Price Dispute Reports: Check customer inquiry reports directly on your Dashboard overview.',
        'Platform Guarantee: Zero commission on direct digital menu views and owner-managed pricing.',
      ],
      quickLink: 'mailto:support@shopmanu.com?subject=Restaurant%20Owner%20Support',
      quickLinkLabel: 'Email Partner Support',
      isExternal: true,
    },
  ];

  const filteredGuides = guides.filter((g) => {
    const matchesTab = activeTab === 'all' || g.category === activeTab;
    const matchesSearch =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-[#1C1512] border border-[#382820] rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#E9A052] bg-[#241A15] px-2.5 py-0.5 rounded-full border border-[#382820] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#E9A052]" />
                  <span>Partner Knowledge Base</span>
                </span>
                <span className="font-mono text-[11px] text-[#B6A69A]/60">· Version 2.0</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EDE5] font-normal tracking-tight">
                Help &amp; Support Center
              </h1>
              <p className="text-xs sm:text-sm text-[#B6A69A] font-sans mt-1 max-w-2xl leading-relaxed">
                Step-by-step guides, image specifications, and practical documentation to manage your digital menu, prices, and restaurant profile with confidence.
              </p>
            </div>

            {/* Direct Support Button */}
            <div className="shrink-0 flex items-center gap-3">
              <a
                href="mailto:support@shopmanu.com?subject=Partner%20Inquiry%20from%20Dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>

          {/* Quick Search */}
          <div className="mt-6 pt-6 border-t border-[#382820]">
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-[#B6A69A]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, pricing questions, photo instructions..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#B6A69A] hover:text-[#F5EDE5]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Guides' },
            { id: 'getting-started', label: 'Getting Started' },
            { id: 'menu', label: 'Menu & Dishes' },
            { id: 'pricing', label: 'Pricing & Portions' },
            { id: 'profile', label: 'Shop Details & Maps' },
            { id: 'images', label: 'Photo Uploads' },
            { id: 'support', label: 'Support Desk' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#241A15] text-[#E9A052] border border-[#382820] font-semibold shadow-sm'
                  : 'bg-[#1C1512] border border-[#382820] text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#241A15]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const Icon = guide.icon;

            return (
              <div
                key={guide.id}
                className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#E9A052]/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#241A15] border border-[#382820] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#E9A052]" />
                    </div>
                    <span className="font-mono text-[10px] text-[#B6A69A]/70 uppercase tracking-wider">
                      Guide #{guide.id}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-[#F5EDE5] mb-1.5">
                    {guide.title}
                  </h3>
                  <p className="font-sans text-xs text-[#B6A69A] leading-relaxed mb-4">
                    {guide.summary}
                  </p>

                  <div className="space-y-2 mb-6">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs text-[#F5EDE5]/90">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E9A052] shrink-0 mt-0.5" />
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#382820] flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#B6A69A]/60">Quick Shortcut</span>
                  {guide.isExternal ? (
                    <a
                      href={guide.quickLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9A052] hover:text-amber-300 transition-colors"
                    >
                      <span>{guide.quickLinkLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      to={guide.quickLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E9A052] hover:text-amber-300 transition-colors"
                    >
                      <span>{guide.quickLinkLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Help Desk Callout */}
        <div className="bg-[#1C1512] text-[#F5EDE5] rounded-3xl p-6 sm:p-8 border border-[#382820] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#E9A052]">
              <Sparkles className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                Direct Restaurant Partner Hotline
              </span>
            </div>
            <h3 className="font-serif text-2xl text-[#F5EDE5] font-light">
              Still have questions or need custom onboarding assistance?
            </h3>
            <p className="font-sans text-xs text-[#B6A69A] max-w-xl">
              Our restaurant partnership team in Kolkata is available Monday through Saturday (10:00 AM – 8:00 PM IST) to assist with dish uploads, verified badge activation, or technical setups.
            </p>
          </div>

          <a
            href="mailto:support@shopmanu.com?subject=Onboarding%20Help%20Request"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg"
          >
            <Mail className="w-4 h-4" />
            <span>Email support@shopmanu.com</span>
          </a>
        </div>
      </div>
    </OwnerLayout>
  );
};
