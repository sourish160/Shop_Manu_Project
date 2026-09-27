import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from '../components/search/SearchBar';
import { MapPin, Navigation, Utensils, Store, ShieldCheck, Loader2 } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { RestaurantResultCard } from '../components/search/RestaurantResultCard';
import { getRestaurantOpeningStatus } from '../utils/operatingHours';
import { getCurrentLocation, saveSessionLocation } from '../utils/geolocation';
import { useSEO } from '../hooks/useSEO';
import { MapScrollHero } from '../components/home/MapScrollHero';

export const HomePage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'Find Restaurants, Menus & Prices Near You',
    description: 'Search authentic dining places, portion prices, and real operating hours near you with zero fake ratings or artificial reviews.',
    canonicalUrl: typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com',
    ogType: 'website',
  });

  const [selectedLocation] = useState('Kolkata');
  const [approvedRestaurants, setApprovedRestaurants] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleQuickChipClick = (term: string) => {
    if (term === 'Near Me') {
      handleNearMeClick();
    } else if (term === 'Salt Lake' || term === 'New Town' || term === 'Park Street') {
      navigate(`/search?location=${encodeURIComponent(term)}&radius=5`);
    } else {
      navigate(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  const handleNearMeClick = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentLocation();
      saveSessionLocation({
        type: 'current',
        name: 'Near Me',
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: 5,
      });
      navigate('/search?location=near-me&radius=5');
    } catch {
      setLocationError('Unable to detect location. Please search by area name or enable browser location.');
      navigate('/search?location=near-me');
    } finally {
      setIsLocating(false);
    }
  };

  // Fetch real approved restaurants from InsForge
  useEffect(() => {
    async function loadApproved() {
      try {
        const { data, error } = await insforge.database
          .from('restaurants')
          .select(
            `id, name, slug, description, address, area, city, status, verified, logo_url, cover_url,
             hours:restaurant_hours(day_of_week, open_time, close_time, is_closed)`
          )
          .eq('status', 'approved')
          .limit(6);

        if (!error && data) {
          const transformed = data.map((r: any) => ({
            ...r,
            openingStatus: getRestaurantOpeningStatus(r.hours || []),
            relevanceScore: 100,
            matchedBy: 'name' as const,
          }));
          setApprovedRestaurants(transformed);
        }
      } catch (err) {
        console.error('Error fetching approved restaurants:', err);
      }
    }

    loadApproved();
  }, []);

  return (
    <div className="min-h-screen bg-[#E3FFFB] flex flex-col">
      {/* Cinematic Full-Bleed Map Scroll Hero */}
      <MapScrollHero
        onSearch={handleSearchSubmit}
        onNearMe={handleNearMeClick}
        isLocating={isLocating}
        locationError={locationError}
        selectedLocation={selectedLocation}
        onQuickChipClick={handleQuickChipClick}
      />

      {/* Forge Automotive Luxury Atelier Marquee */}
      <div className="w-full border-y border-white/10 bg-[#0B0B0B] py-3.5 overflow-hidden select-none">
        <div className="animate-marquee items-center gap-12 text-xs font-mono tracking-[0.28em] uppercase text-[#F4F2ED]/70">
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> BESPOKE DINING DISCOVERY
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> VERIFIED PORTION PRICING
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> LIVE OPERATING HOURS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> ZERO ARTIFICIAL REVIEWS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> DIRECT KITCHEN ACCESS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> KOLKATA ATELIER GRID
          </span>
          {/* duplicate for seamless loop */}
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> BESPOKE DINING DISCOVERY
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> VERIFIED PORTION PRICING
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> LIVE OPERATING HOURS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> ZERO ARTIFICIAL REVIEWS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> DIRECT KITCHEN ACCESS
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#C5A064]">◆</span> KOLKATA ATELIER GRID
          </span>
        </div>
      </div>

      {/* Main Directory & Content Container */}
      <div
        id="explore-restaurants-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full"
      >
        {/* Quick Search & Location Bar for Browsing Section */}
        <div className="forge-card rounded-2xl p-6 sm:p-8 shadow-2xl mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C5A064] block mb-1">
                Refine Selection
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] tracking-tight">
                Search Local Menus & Places
              </h2>
              <p className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/70 mt-0.5">
                Filter by dish, portion variant prices, or restaurant name in {selectedLocation}
              </p>
            </div>

            <div className="inline-flex items-center space-x-2.5 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-[#F4F2ED]/80 self-start md:self-auto">
              <MapPin className="w-3.5 h-3.5 text-[#C5A064] shrink-0" aria-hidden="true" />
              <span>
                City: <strong className="text-white font-semibold">{selectedLocation}</strong>
              </span>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={handleNearMeClick}
                disabled={isLocating}
                className="inline-flex items-center space-x-1.5 text-[#C5A064] hover:text-[#d8b577] font-semibold transition-colors focus-visible:ring-1 focus-visible:ring-[#C5A064] rounded uppercase tracking-wider text-[11px]"
                title="Search restaurants near your current location"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#C5A064]" aria-hidden="true" />
                ) : (
                  <Navigation className="w-3 h-3 text-[#C5A064]" aria-hidden="true" />
                )}
                <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
              </button>
            </div>
          </div>

          <SearchBar
            onSearch={handleSearchSubmit}
            placeholder="Search food dish or restaurant name..."
            size="large"
          />

          {locationError && (
            <p className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg px-4 py-2 mt-3 inline-block">
              {locationError}
            </p>
          )}

          {/* Quick Discovery Tags */}
          <div className="flex items-center flex-wrap gap-2.5 text-xs pt-5 mt-4 border-t border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C5A064]">Trending:</span>
            {['Near Me', 'Chicken Biryani', 'Kebab', 'Rolls', 'Salt Lake', 'New Town', 'Park Street'].map(
              (tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickChipClick(tag)}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs tracking-wider uppercase transition-all ${
                    tag === 'Near Me'
                      ? 'bg-[#C5A064] text-[#080808] font-bold shadow-lg hover:bg-[#d8b577]'
                      : 'bg-black/60 hover:bg-black/90 text-[#F4F2ED]/70 hover:text-white border border-white/10 hover:border-[#C5A064]/50'
                  }`}
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>

        {/* Real Approved Restaurants Section */}
        {approvedRestaurants.length > 0 && (
          <section className="mb-20" aria-labelledby="home-restaurants-heading">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-black/15 gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#080808]/70 block mb-1">
                  Atelier Collection
                </span>
                <h2 id="home-restaurants-heading" className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-[#080808] tracking-tight">
                  Approved Kitchens
                </h2>
                <p className="font-sans font-light text-xs sm:text-sm text-[#080808]/75 mt-1">
                  Verified culinary establishments with authentic portion rates and real schedules
                </p>
              </div>
              <Link
                to="/search?tab=restaurants"
                className="font-mono text-xs tracking-[0.2em] uppercase text-[#080808] hover:text-black font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto border-b border-[#080808]/30 pb-0.5"
              >
                <span>Browse All Places</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedRestaurants.map((restaurant) => (
                <RestaurantResultCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </section>
        )}

        {/* Platform Pillars / Info */}
        <section className="mb-20" aria-label="Platform Features">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#080808]/70 block mb-1">
              Atelier Standards
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-light text-[#080808] tracking-tight">
              Crafted for Honest Dining
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="forge-card rounded-2xl p-7 relative overflow-hidden group">
              <span className="font-mono text-[11px] text-[#C5A064] tracking-[0.25em] block mb-3">
                01 / INTEGRITY
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] mb-4 group-hover:border-[#C5A064]/50 transition-colors">
                <Utensils className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-editorial text-2xl font-light text-[#F4F2ED] mb-2">
                Exact Variant Pricing
              </h3>
              <p className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/70 leading-relaxed">
                Search food items with real portion pricing. Filter by Half or Full variants with genuine prices directly entered by chefs and owners.
              </p>
            </div>

            <div className="forge-card rounded-2xl p-7 relative overflow-hidden group">
              <span className="font-mono text-[11px] text-[#C5A064] tracking-[0.25em] block mb-3">
                02 / SCHEDULES
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] mb-4 group-hover:border-[#C5A064]/50 transition-colors">
                <Store className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-editorial text-2xl font-light text-[#F4F2ED] mb-2">
                Real Operating Hours
              </h3>
              <p className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/70 leading-relaxed">
                Live open and closed indicators computed directly from owners' verified schedules, including overnight shifts and holiday adjustments.
              </p>
            </div>

            <div className="forge-card rounded-2xl p-7 relative overflow-hidden group">
              <span className="font-mono text-[11px] text-[#C5A064] tracking-[0.25em] block mb-3">
                03 / TRANSPARENCY
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] mb-4 group-hover:border-[#C5A064]/50 transition-colors">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-editorial text-2xl font-light text-[#F4F2ED] mb-2">
                Zero Fake Content
              </h3>
              <p className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/70 leading-relaxed">
                No artificial reviews, no inflated metrics, and no paid simulated rankings. Every single detail reflects authentic verified database records.
              </p>
            </div>
          </div>
        </section>

        {/* Shop Owner Portal Access Banner */}
        <div className="forge-card rounded-2xl p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border border-white/10">
          <div>
            <span className="font-mono text-[10px] font-semibold text-[#C5A064] uppercase tracking-[0.3em] block">
              Culinary Partners
            </span>
            {user && profile ? (
              <div className="font-mono text-xs text-[#F4F2ED]/80 mt-1.5">
                Authenticated as <span className="font-semibold text-white">{profile.name}</span> (Role: <span className="font-semibold text-[#C5A064] uppercase">{profile.role === 'owner' ? 'Shop Owner' : profile.role}</span>)
              </div>
            ) : (
              <div className="font-sans font-light text-xs sm:text-sm text-[#F4F2ED]/70 mt-1">
                Are you a restaurant or shop owner? List your business, update dish prices, and configure operating hours.
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {profile?.role === 'owner' ? (
              <Link
                to="/owner"
                className="forge-btn text-xs font-mono uppercase tracking-widest px-5 py-2.5 rounded-xl"
              >
                Owner Portal Dashboard
              </Link>
            ) : profile?.role === 'admin' ? (
              <Link
                to="/admin"
                className="forge-btn text-xs font-mono uppercase tracking-widest px-5 py-2.5 rounded-xl"
              >
                Admin Moderation
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-mono text-xs uppercase tracking-widest text-[#F4F2ED]/70 hover:text-white px-4 py-2.5 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
                >
                  Owner Login
                </Link>
                <Link
                  to="/register"
                  className="forge-btn text-xs font-mono uppercase tracking-widest px-4 py-2.5 rounded-xl"
                >
                  Register Your Shop
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
