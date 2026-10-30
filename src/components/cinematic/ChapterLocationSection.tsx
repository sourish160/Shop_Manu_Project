import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navigation,
  MapPin,
  ArrowRight,
  Store,
  Loader2,
  CheckCircle2,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { insforge, RestaurantHours } from '../../lib/insforge';
import { getRestaurantOpeningStatus, OpeningStatusResult } from '../../utils/operatingHours';
import { loadGoogleMaps, isGoogleMapsConfigured } from '../../utils/googleMapsLoader';
import {
  KNOWN_LOCALITIES,
  KnownLocality,
  getCurrentLocation,
  calculateHaversineDistanceKm,
  formatDistance,
  validateCoordinates,
  loadSessionLocation,
  saveSessionLocation,
  LocationState,
} from '../../utils/geolocation';
import { ChapterSection } from './ChapterSection';
import { EditorialHeading } from './EditorialHeading';
import { ScrollReveal } from './ScrollReveal';
import { resolveLocalityImage, LOCATION_IMAGE_MAP } from './locationAssets';

interface LocationShopRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  verified?: boolean;
  cover_url?: string | null;
  hours?: RestaurantHours[];
  foods?: Array<{ id: string; name: string }>;
  openingStatus?: OpeningStatusResult;
  distanceKm?: number | null;
}

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#151210' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#151210' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8aea8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f5f2eb' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c88a58' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a1817' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a2421' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f1a17' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9a9184' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#4a301b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a0807' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5e554c' }],
  },
];

export const ChapterLocationSection: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [shops, setShops] = useState<LocationShopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // User location state (defaults to session storage or Kolkata overview)
  const [locationState, setLocationState] = useState<LocationState>(() => {
    const saved = loadSessionLocation();
    if (saved && saved.type !== 'none' && saved.latitude && saved.longitude) {
      return saved;
    }
    return {
      type: 'none',
      name: 'Entire City',
      latitude: 22.5726,
      longitude: 88.3639,
      radiusKm: 5,
    };
  });

  // Selected neighborhood tab
  const [activeAreaTab, setActiveAreaTab] = useState<string>('all');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Map DOM and instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Fetch approved restaurants with coordinates from InsForge
  useEffect(() => {
    let isMounted = true;
    async function loadShops() {
      setIsLoading(true);
      try {
        const { data, error } = await insforge.database
          .from('restaurants')
          .select(`
            id, name, slug, description, address, area, city, latitude, longitude, status, verified, cover_url,
            hours:restaurant_hours(day_of_week, open_time, close_time, is_closed),
            foods:foods(id, name)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching Chapter V shops:', error);
        } else if (data && isMounted) {
          const transformed = (data as unknown as LocationShopRecord[]).map((r) => ({
            ...r,
            openingStatus: getRestaurantOpeningStatus(r.hours || []),
          }));
          setShops(transformed);
        }
      } catch (err) {
        console.error('Exception fetching Chapter V shops:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadShops();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute real distance only if user has actual coordinates
  const processedShops = useMemo(() => {
    const hasUserCoords =
      locationState.type !== 'none' &&
      typeof locationState.latitude === 'number' &&
      typeof locationState.longitude === 'number' &&
      validateCoordinates(locationState.latitude, locationState.longitude);

    return shops.map((shop) => {
      let distanceKm: number | null = null;
      if (
        hasUserCoords &&
        typeof shop.latitude === 'number' &&
        typeof shop.longitude === 'number' &&
        validateCoordinates(shop.latitude, shop.longitude)
      ) {
        distanceKm = calculateHaversineDistanceKm(
          locationState.latitude!,
          locationState.longitude!,
          shop.latitude,
          shop.longitude
        );
      }
      return {
        ...shop,
        distanceKm,
      };
    });
  }, [shops, locationState]);

  // Filter shops by active area tab
  const filteredShops = useMemo(() => {
    let list = processedShops;
    if (activeAreaTab !== 'all') {
      list = list.filter((s) => s.area?.toLowerCase() === activeAreaTab.toLowerCase());
    }

    // Sort by proximity if distance is available, else keep database order
    return [...list].sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
  }, [processedShops, activeAreaTab]);

  // Handle "Near Me" GPS button
  const handleNearMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentLocation();
      const newState: LocationState = {
        type: 'current',
        name: 'Near Me',
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: locationState.radiusKm || 5,
      };
      saveSessionLocation(newState);
      setLocationState(newState);
      setActiveAreaTab('all');

      // Center map on user coordinates
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: coords.latitude, lng: coords.longitude });
        mapInstanceRef.current.setZoom(14);
      }
    } catch (err: any) {
      console.warn('Geolocation failed:', err.message);
      setLocationError(
        'Unable to detect your precise device location. Please choose a neighborhood below.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Handle Locality Selection
  const handleSelectLocality = (loc: KnownLocality) => {
    const newState: LocationState = {
      type: 'manual',
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusKm: locationState.radiusKm || 5,
    };
    saveSessionLocation(newState);
    setLocationState(newState);
    setActiveAreaTab(loc.area);
    setLocationError(null);

    // Pan map to locality center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
      mapInstanceRef.current.setZoom(14);
    }
  };

  // Initialize and update Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current) return;
    if (!isGoogleMapsConfigured()) return;

    try {
      const maps = await loadGoogleMaps();
      if (!mapContainerRef.current) return;

      const centerPos = {
        lat: locationState.latitude || 22.5726,
        lng: locationState.longitude || 88.3639,
      };

      if (!mapInstanceRef.current) {
        const map = new maps.Map(mapContainerRef.current, {
          center: centerPos,
          zoom: 12,
          styles: DARK_MAP_STYLES,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });
        mapInstanceRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // Render markers for real shops with coordinates
      shops.forEach((shop) => {
        if (
          typeof shop.latitude === 'number' &&
          typeof shop.longitude === 'number' &&
          validateCoordinates(shop.latitude, shop.longitude)
        ) {
          const marker = new maps.Marker({
            position: { lat: shop.latitude, lng: shop.longitude },
            map: mapInstanceRef.current!,
            title: shop.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#C88A58',
              fillOpacity: 1,
              strokeColor: '#0A0807',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            setSelectedShopId(shop.id);
            if (infoWindowRef.current && mapInstanceRef.current) {
              const isOpen = shop.openingStatus?.isOpen;
              const statusBadge =
                isOpen !== null
                  ? `<span style="color: ${isOpen ? '#34D399' : '#9CA3AF'}; font-size: 10px; font-weight: 600;">${
                      isOpen ? '● Open Now' : '● Closed'
                    }</span>`
                  : '';

              const content = `
                <div style="background: #120E0C; color: #FAF8F5; padding: 12px; border-radius: 8px; font-family: sans-serif; min-width: 180px;">
                  <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px; font-family: serif;">${shop.name}</div>
                  <div style="font-size: 11px; color: #D4CEC4; margin-bottom: 6px;">${shop.area || 'Kolkata'} ${statusBadge}</div>
                  <a href="/restaurant/${shop.slug}" style="display: inline-block; background: #C88A58; color: #0A0807; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-decoration: none; text-transform: uppercase;">View Menu &rarr;</a>
                </div>
              `;
              infoWindowRef.current.setContent(content);
              infoWindowRef.current.open(mapInstanceRef.current, marker);
            }
          });

          markersRef.current.push(marker);
        }
      });
    } catch (err) {
      console.warn('Google Maps initialization failed in Chapter V:', err);
    }
  }, [shops, locationState.latitude, locationState.longitude]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  return (
    <ChapterSection
      id="chapter-around-you"
      chapterNumber="V"
      chapterLabel="Find Food Near You"
      scrimIntensity="deep"
      layout="full"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
            CHAPTER V HEADER
            ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-6">
          <ScrollReveal direction="up" delay={0.04}>
            <EditorialHeading
              chapterNumber="V"
              eyebrow="Find Food Near You"
              title="FIND FOOD *NEAR YOU*"
              subtitle="Locate verified kitchens and digital menus across Kolkata. Check live operating hours, navigate by neighborhood, and view exact shop locations."
              size="lg"
              className="max-w-3xl"
            />
          </ScrollReveal>

          {/* Location radius metadata */}
          <ScrollReveal direction="up" delay={0.08} className="lg:mb-2 shrink-0">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/50">
              {locationState.name} · {locationState.radiusKm} km Radius
            </span>
          </ScrollReveal>
        </div>

        {/* =====================================================================
            PROMINENT LOCATION SEARCH & NEIGHBORHOOD SELECTOR BAR
            ===================================================================== */}
        <ScrollReveal direction="up" delay={0.08} className="mb-10 sm:mb-12">
          <div className="editorial-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-200/12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* GPS "Near Me" Button */}
              <button
                type="button"
                onClick={handleNearMe}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#0A0807] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-amber-400/20 disabled:opacity-60 cursor-pointer shrink-0"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-[#0A0807]" />
                )}
                <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
              </button>

              {/* Neighborhood Quick Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cream-200/50 shrink-0 hidden sm:inline mr-1">
                  Neighborhoods:
                </span>
                {KNOWN_LOCALITIES.slice(0, 4).map((loc) => {
                  const isSelected = activeAreaTab.toLowerCase() === loc.area.toLowerCase();
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocality(loc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold'
                          : 'bg-[#120E0C] text-cream-200/70 hover:text-cream-100 hover:bg-cream-200/10 border border-cream-200/10'
                      }`}
                    >
                      {loc.area}
                    </button>
                  );
                })}
              </div>

              {/* Search Page CTA */}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    locationState.type === 'current'
                      ? `/search?location=near-me&radius=${locationState.radiusKm}`
                      : `/search?location=${encodeURIComponent(locationState.name)}&radius=${locationState.radiusKm}`
                  )
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cream-100/10 hover:bg-cream-100/15 text-cream-100 font-sans font-medium text-xs uppercase tracking-wider border border-cream-200/15 transition-all shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Open Full Nearby Search</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>

            {/* Optional Geolocation feedback notice */}
            {locationError && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-200 font-sans">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* =====================================================================
            IMMERSIVE MAP & NEARBY SHOPS SPLIT (Natural Visual Transition)
            ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Interactive Google Map Container (7 cols) */}
          <ScrollReveal direction="up" delay={0.1} className="lg:col-span-7">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-cream-200/12 shadow-2xl bg-[#120E0C] h-[460px] sm:h-[540px]">
              {/* Google Map Element */}
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Overlay Map Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0807]/85 backdrop-blur-md border border-cream-200/15 text-xs font-mono text-cream-100 shadow-lg pointer-events-auto">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kolkata Culinary Map</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0807]/85 backdrop-blur-md border border-cream-200/15 text-[10px] font-mono text-amber-300 uppercase tracking-widest shadow-lg pointer-events-auto">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{shops.filter((s) => s.latitude && s.longitude).length} Mapped Shops</span>
                </div>
              </div>

              {/* Graceful unconfigured / loading indicator */}
              {!isGoogleMapsConfigured() && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#120E0C]/95 backdrop-blur-sm">
                  <MapPin className="w-12 h-12 text-amber-400 mb-3" />
                  <h4 className="font-serif text-2xl text-cream-100 mb-2 font-normal">
                    Interactive Map Canvas
                  </h4>
                  <p className="text-xs text-cream-200/70 font-sans max-w-sm mb-4">
                    Explore registered restaurants by neighborhood below. Configure your Google Maps key in settings to unlock live satellite navigation.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/search')}
                    className="px-4 py-2 rounded-lg bg-amber-400 text-[#0A0807] font-semibold text-xs uppercase tracking-wider"
                  >
                    Browse All Registered Locations
                  </button>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Real Nearby Shops List (5 cols) */}
          <ScrollReveal direction="up" delay={0.14} className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200/10">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream-200/70">
                Verified Nearby Establishments
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                {filteredShops.length} Found
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-cream-100/5 animate-pulse border border-cream-200/10" />
                ))}
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="editorial-card p-8 rounded-2xl text-center border border-cream-200/10">
                <Store className="w-8 h-8 text-amber-400/60 mx-auto mb-2" />
                <h5 className="font-serif text-lg text-cream-100 mb-1">No Shops Found in this Area</h5>
                <p className="text-xs text-cream-200/60 font-sans mb-4">
                  Try switching back to all neighborhoods or use the radius expansion tool in search.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveAreaTab('all')}
                  className="px-4 py-1.5 rounded-md bg-amber-400 text-[#0A0807] text-xs font-semibold uppercase tracking-wider"
                >
                  View All Areas
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredShops.slice(0, 5).map((shop) => {
                  const isOpen = shop.openingStatus?.isOpen;
                  const statusText = shop.openingStatus?.statusText;
                  const isSelected = selectedShopId === shop.id;

                  return (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedShopId(shop.id)}
                      className={`group relative rounded-xl p-4 sm:p-5 transition-all duration-300 border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-lg'
                          : 'bg-[#120E0C]/90 hover:bg-[#120E0C] border-cream-200/10 hover:border-amber-400/30'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-amber-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3" />
                          <span>{shop.area || shop.city || 'Kolkata'}</span>
                        </span>

                        {/* Genuine distance or Live operating status */}
                        <div className="flex items-center gap-2">
                          {shop.distanceKm !== null && (
                            <span className="text-[10px] font-mono text-cream-200/80 bg-cream-100/10 px-2 py-0.5 rounded">
                              {formatDistance(shop.distanceKm)}
                            </span>
                          )}

                          {isOpen !== null && (
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                                isOpen
                                  ? 'text-emerald-300 bg-emerald-500/15'
                                  : 'text-cream-200/50 bg-cream-200/10'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOpen ? 'bg-emerald-400' : 'bg-cream-200/40'
                                }`}
                              />
                              {statusText || (isOpen ? 'Open' : 'Closed')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name & Details */}
                      <h4 className="font-serif text-lg sm:text-xl text-cream-100 font-normal group-hover:text-amber-200 transition-colors mb-1">
                        {shop.name}
                      </h4>

                      {shop.address && (
                        <p className="text-xs text-cream-200/60 font-sans line-clamp-1 mb-3">
                          {shop.address}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-cream-200/10 text-xs">
                        <span className="font-mono text-[10px] text-cream-200/50">
                          {shop.foods?.length ?? 0} Dishes Indexed
                        </span>

                        <Link
                          to={`/restaurant/${shop.slug}`}
                          className="inline-flex items-center gap-1 font-sans text-xs uppercase tracking-wider text-amber-300 hover:text-amber-200 font-medium group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Explore Menu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollReveal>
        </div>

        {/* =====================================================================
            ATMOSPHERIC NEIGHBORHOOD STORYTELLING CARDS
            ===================================================================== */}
        <div className="pt-8 border-t border-cream-200/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block mb-1">
                Kolkata Dining Quarters
              </span>
              <h4 className="font-serif text-2xl text-cream-100 font-light">
                Explore Signature Locality Profiles
              </h4>
            </div>

            <p className="text-xs text-cream-200/60 font-sans max-w-sm">
              Each neighborhood represents a unique culinary era—from historic Awadhi handis to late-night street tawas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                quarter: 'Park Street Quarter',
                highlight: 'Heritage Dining & Awadhi Dum Biryani',
                desc: 'Centuries of culinary history. Fragrant saffron rice, slow-braised meats, and iconic tea rooms with historic dignity.',
                area: 'Park Street',
                image: resolveLocalityImage('Park Street'),
              },
              {
                quarter: 'Salt Lake Quarter',
                highlight: 'Artisan Kathi Rolls & Contemporary Tawas',
                desc: 'Thriving street gastronomy, sizzling iron tawas, hand-pulled parathas, and bustling evening food corridors.',
                area: 'Salt Lake',
                image: resolveLocalityImage('Salt Lake'),
              },
              {
                quarter: 'New Town Quarter',
                highlight: 'Late-Night Kitchens & Cafe Smashes',
                desc: 'Modern craft burger bars, fusion street food, cloud bakeries, and vibrant quick-service kitchens.',
                area: 'New Town',
                image: resolveLocalityImage('New Town'),
              },
            ].map((q, i) => (
              <ScrollReveal key={q.quarter} direction="up" delay={0.08 * i}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveAreaTab(q.area);
                    const matching = KNOWN_LOCALITIES.find((l) => l.area.toLowerCase() === q.area.toLowerCase());
                    if (matching) handleSelectLocality(matching);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveAreaTab(q.area);
                      const matching = KNOWN_LOCALITIES.find((l) => l.area.toLowerCase() === q.area.toLowerCase());
                      if (matching) handleSelectLocality(matching);
                    }
                  }}
                  className="editorial-card rounded-2xl overflow-hidden group relative flex flex-col justify-between shadow-2xl h-full border border-cream-200/12 cursor-pointer hover:border-amber-400/40 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={q.image}
                      alt={q.quarter}
                      className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.08] transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = LOCATION_IMAGE_MAP.default;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120E0C] via-transparent to-transparent pointer-events-none" />
                    <span className="absolute top-4 left-4 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-amber-300 border border-cream-200/15">
                      Locality Spotlight
                    </span>
                  </div>

                  <div className="p-6">
                    <h5 className="font-serif text-2xl text-cream-100 font-light mb-1.5 group-hover:text-amber-200 transition-colors">
                      {q.quarter}
                    </h5>
                    <p className="text-xs text-amber-300/90 font-sans font-medium mb-3">
                      {q.highlight}
                    </p>
                    <p className="text-xs text-cream-200/65 font-sans leading-relaxed mb-4">
                      {q.desc}
                    </p>

                    <div className="pt-3 border-t border-cream-200/10 flex items-center justify-between text-xs font-mono text-amber-400 group-hover:text-amber-300">
                      <span>View {q.area} Kitchens</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </ChapterSection>
  );
};
