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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section with Direct, Non-Marketing Copy */}
      <div className="border border-slate-200 bg-white rounded-lg p-6 sm:p-10 shadow-sm mb-10">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Find restaurants, menus and prices near you.
          </h1>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Search live menus, dish variant prices, and verified dining places across your city.
          </p>

          {/* Location Control Indicator */}
          <div className="mt-5 inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>
              City: <strong className="text-slate-900 font-semibold">{selectedLocation}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleNearMeClick}
              disabled={isLocating}
              className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 font-semibold transition-colors focus-visible:ring-1 focus-visible:ring-slate-900 rounded"
              title="Search restaurants near your current location"
            >
              {isLocating ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-600" aria-hidden="true" />
              ) : (
                <Navigation className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              )}
              <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>
          </div>

          {locationError && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-1 inline-block">
              {locationError}
            </p>
          )}
        </div>

        {/* Primary Search Input */}
        <div className="max-w-2xl mx-auto mb-6">
          <SearchBar
            onSearch={handleSearchSubmit}
            placeholder="Search food dish or restaurant name..."
            size="large"
            autoFocus
          />
        </div>

        {/* Quick Discovery Tags */}
        <div className="max-w-2xl mx-auto flex items-center justify-center flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick Explore:</span>
          {['Near Me', 'Chicken Biryani', 'Kebab', 'Rolls', 'Salt Lake', 'New Town', 'Park Street'].map(
            (tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickChipClick(tag)}
                className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                  tag === 'Near Me'
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
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
        <section className="mb-12" aria-labelledby="home-restaurants-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="home-restaurants-heading" className="text-xl font-bold text-slate-900 tracking-tight">
                Discover Restaurants
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Approved dining establishments with current menus and operating hours
              </p>
            </div>
            <Link
              to="/search?tab=restaurants"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
            >
              Browse all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedRestaurants.map((restaurant) => (
              <RestaurantResultCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      {/* Platform Pillars / Info */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10" aria-label="Platform Features">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
            <Utensils className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Exact Variant Pricing
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Search food items with real portion pricing. Filter by Half or Full variants with genuine prices.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
            <Store className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Real Operating Hours
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live open and closed indicators computed directly from owners' verified schedules, including overnight shifts.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Zero Fake Content
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            No artificial reviews, no inflated metrics, and no simulated ratings. Everything reflects verified data.
          </p>
        </div>
      </section>

      {/* Account & Role Status */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Session & Access
          </span>
          {user && profile ? (
            <div className="text-xs text-slate-700 mt-1">
              Signed in as <span className="font-semibold text-slate-900">{profile.name}</span> (Role: <span className="font-semibold text-slate-900 uppercase">{profile.role}</span>)
            </div>
          ) : (
            <div className="text-xs text-slate-600 mt-1">
              Not signed in. Register as a customer or restaurant owner.
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {profile?.role === 'owner' ? (
            <Link
              to="/owner"
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Go to Owner Dashboard
            </Link>
          ) : user ? (
            <Link
              to="/search"
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Explore Food & Menus
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 border border-slate-300 bg-white text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
