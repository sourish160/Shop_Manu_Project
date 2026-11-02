import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import {
  ExternalLink,
  Clock,
  Store,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Trash2,
  Info,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';
import { insforge, Restaurant, RestaurantHours, uploadMediaImage } from '../lib/insforge';
import { DAY_NAMES } from '../utils/operatingHours';
import { OwnerLocationPicker } from '../components/maps/OwnerLocationPicker';
import { validateCoordinates } from '../utils/geolocation';
import { useSEO } from '../hooks/useSEO';
import { sanitizeErrorMessage } from '../utils/errorHandler';

interface DayScheduleForm {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface GalleryPhoto {
  id: string;
  url: string;
  tag: 'interior' | 'exterior' | 'ambience' | 'food';
  caption: string;
}

const CUISINE_OPTIONS = [
  'Bengali & Mughlai',
  'North Indian & Tandoor',
  'South Indian',
  'Chinese & Asian',
  'Continental & Cafe',
  'Street Food & Snacks',
  'Bakery & Desserts',
  'Biryani Specialist',
  'Multi-Cuisine',
];

export const EditRestaurantPage: React.FC = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Restaurant Profile — ManuMania Owner Portal',
    noIndex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantId = searchParams.get('id');

  const [, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Section Save Loading States
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);

  // Upload States
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Feedback Messages
  const [feedback, setFeedback] = useState<{
    section: 'basic' | 'location' | 'hours' | 'photos' | 'global' | null;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Section A: Basic Information Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Bengali & Mughlai');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Section B: Location Form Fields
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Section C: Operating Hours
  const [schedule, setSchedule] = useState<DayScheduleForm[]>(
    DAY_NAMES.map((_, i) => ({
      day_of_week: i,
      open_time: '10:00',
      close_time: '22:00',
      is_closed: false,
    }))
  );

  // Section D: Restaurant Photography
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);

  // Load Data
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const items = (data || []) as Restaurant[];
      setRestaurants(items);

      if (items.length === 0) {
        setIsLoading(false);
        return;
      }

      let active = items[0];
      if (restaurantId) {
        const found = items.find((r) => r.id === restaurantId);
        if (found) {
          active = found;
        } else {
          setFeedback({
            section: 'global',
            type: 'error',
            message: 'Restaurant not found or permission denied.',
          });
          setRestaurant(null);
          setIsLoading(false);
          return;
        }
      } else {
        setSearchParams({ id: active.id }, { replace: true });
      }

      setRestaurant(active);
      setName(active.name || '');
      setDescription(active.description || '');
      setCategory(active.category || 'Bengali & Mughlai');
      setPhone(active.phone || '');
      setWebsite(active.website || '');
      setAddress(active.address || '');
      setArea(active.area || '');
      setCity(active.city || '');
      setLatitude(
        active.latitude !== null && active.latitude !== undefined
          ? Number(active.latitude)
          : null
      );
      setLongitude(
        active.longitude !== null && active.longitude !== undefined
          ? Number(active.longitude)
          : null
      );
      setLogoUrl(active.logo_url);
      setCoverUrl(active.cover_url);

      // Load gallery from storage / local storage if saved
      const savedGalleryKey = `manumania_gallery_${active.id}`;
      try {
        const raw = localStorage.getItem(savedGalleryKey);
        if (raw) {
          setGalleryPhotos(JSON.parse(raw));
        }
      } catch (err) {
        // ignore storage parse error
      }

      // Load operating hours
      const { data: hData } = await insforge.database
        .from('restaurant_hours')
        .select('*')
        .eq('restaurant_id', active.id);

      if (hData && hData.length > 0) {
        const loadedList = hData as RestaurantHours[];
        setSchedule(
          DAY_NAMES.map((_, i) => {
            const match = loadedList.find((h) => h.day_of_week === i);
            return {
              day_of_week: i,
              open_time: match?.open_time ? match.open_time.slice(0, 5) : '10:00',
              close_time: match?.close_time ? match.close_time.slice(0, 5) : '22:00',
              is_closed: match ? match.is_closed : false,
            };
          })
        );
      }
    } catch (err: unknown) {
      setFeedback({
        section: 'global',
        type: 'error',
        message: sanitizeErrorMessage(err, 'Failed to load restaurant profile.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurantId, setSearchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Missing Information Verification Checklist
  const missingInfoList = useMemo(() => {
    if (!restaurant) return [];
    const missing: { label: string; sectionId: string; resolved: boolean }[] = [
      { label: 'Restaurant Name', sectionId: 'section-basic', resolved: Boolean(name.trim()) },
      { label: 'Restaurant Cuisine / Type', sectionId: 'section-basic', resolved: Boolean(category) },
      { label: 'Contact Phone Number', sectionId: 'section-basic', resolved: Boolean(phone.trim()) },
      { label: 'Full Street Address', sectionId: 'section-location', resolved: Boolean(address.trim()) },
      { label: 'Area & City Specified', sectionId: 'section-location', resolved: Boolean(area.trim() && city.trim()) },
      {
        label: 'Map Coordinates Pinned',
        sectionId: 'section-location',
        resolved: latitude !== null && longitude !== null,
      },
      {
        label: 'Weekly Operating Hours Configured',
        sectionId: 'section-hours',
        resolved: schedule.some((s) => !s.is_closed && s.open_time),
      },
      { label: 'Restaurant Brand Logo', sectionId: 'section-photos', resolved: Boolean(logoUrl) },
      { label: 'Cover Banner Photograph', sectionId: 'section-photos', resolved: Boolean(coverUrl) },
    ];
    return missing;
  }, [restaurant, name, category, phone, address, area, city, latitude, longitude, schedule, logoUrl, coverUrl]);

  const completedCount = missingInfoList.filter((m) => m.resolved).length;
  const totalCount = missingInfoList.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  // SECTION A: Save Basic Information
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setFeedback(null);

    if (!name.trim() || name.trim().length < 2) {
      setFeedback({
        section: 'basic',
        type: 'error',
        message: 'Restaurant name must be at least 2 characters long.',
      });
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setFeedback({
        section: 'basic',
        type: 'error',
        message: 'Please provide a valid contact phone number.',
      });
      return;
    }

    setIsSavingBasic(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          phone: phone.trim(),
          website: website.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setRestaurant(data as Restaurant);
      setFeedback({
        section: 'basic',
        type: 'success',
        message: 'Basic Information updated successfully.',
      });
    } catch (err: unknown) {
      setFeedback({
        section: 'basic',
        type: 'error',
        message: sanitizeErrorMessage(err, 'Failed to update basic information.'),
      });
    } finally {
      setIsSavingBasic(false);
    }
  };

  // SECTION B: Save Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setFeedback(null);

    if (!address.trim() || address.trim().length < 5) {
      setFeedback({
        section: 'location',
        type: 'error',
        message: 'Full street address is required (minimum 5 characters).',
      });
      return;
    }

    if (!area.trim() || !city.trim()) {
      setFeedback({
        section: 'location',
        type: 'error',
        message: 'Both Area and City are required for Kolkata dining discovery.',
      });
      return;
    }

    if (latitude !== null && longitude !== null) {
      if (!validateCoordinates(Number(latitude), Number(longitude))) {
        setFeedback({
          section: 'location',
          type: 'error',
          message: 'Latitude must be between -90 and 90, Longitude between -180 and 180.',
        });
        return;
      }
    }

    setIsSavingLocation(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .update({
          address: address.trim(),
          area: area.trim(),
          city: city.trim(),
          latitude: latitude !== null ? Number(latitude) : null,
          longitude: longitude !== null ? Number(longitude) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setRestaurant(data as Restaurant);
      setFeedback({
        section: 'location',
        type: 'success',
        message: 'Restaurant location and coordinates saved successfully.',
      });
    } catch (err: unknown) {
      setFeedback({
        section: 'location',
        type: 'error',
        message: sanitizeErrorMessage(err, 'Failed to update location details.'),
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  // SECTION C: Save Opening Hours
  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setFeedback(null);
    setIsSavingHours(true);

    try {
      const rows = schedule.map((item) => ({
        restaurant_id: restaurant.id,
        day_of_week: item.day_of_week,
        open_time: item.is_closed ? null : item.open_time ? `${item.open_time}:00` : '10:00:00',
        close_time: item.is_closed ? null : item.close_time ? `${item.close_time}:00` : '22:00:00',
        is_closed: item.is_closed,
        updated_at: new Date().toISOString(),
      }));

      await insforge.database.from('restaurant_hours').delete().eq('restaurant_id', restaurant.id);
      const { error: insertErr } = await insforge.database.from('restaurant_hours').insert(rows);

      if (insertErr) throw new Error(insertErr.message);

      setFeedback({
        section: 'hours',
        type: 'success',
        message: 'Weekly operating hours updated successfully.',
      });
    } catch (err: unknown) {
      setFeedback({
        section: 'hours',
        type: 'error',
        message: sanitizeErrorMessage(err, 'Failed to save operating hours.'),
      });
    } finally {
      setIsSavingHours(false);
    }
  };

  // SECTION D: Save Photography & Media
  const handleSavePhotos = async () => {
    if (!restaurant) return;
    setFeedback(null);
    setIsSavingPhotos(true);

    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .update({
          logo_url: logoUrl,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Save gallery photos list to local storage
      const savedGalleryKey = `manumania_gallery_${restaurant.id}`;
      localStorage.setItem(savedGalleryKey, JSON.stringify(galleryPhotos));

      setRestaurant(data as Restaurant);
      setFeedback({
        section: 'photos',
        type: 'success',
        message: 'Photography and brand media saved successfully.',
      });
    } catch (err: unknown) {
      setFeedback({
        section: 'photos',
        type: 'error',
        message: sanitizeErrorMessage(err, 'Failed to save photography media.'),
      });
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setFeedback(null);
    try {
      const result = await uploadMediaImage(file);
      setLogoUrl(result.url);
      setFeedback({
        section: 'photos',
        type: 'success',
        message: 'Logo uploaded. Remember to click "Save Photography" below.',
      });
    } catch (err: any) {
      setFeedback({
        section: 'photos',
        type: 'error',
        message: err.message || 'Logo upload failed.',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    setFeedback(null);
    try {
      const result = await uploadMediaImage(file);
      setCoverUrl(result.url);
      setFeedback({
        section: 'photos',
        type: 'success',
        message: 'Cover banner uploaded. Click "Save Photography" below to preserve changes.',
      });
    } catch (err: any) {
      setFeedback({
        section: 'photos',
        type: 'error',
        message: err.message || 'Cover photo upload failed.',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    tag: 'interior' | 'exterior' | 'ambience' | 'food'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingGallery(true);
    setFeedback(null);
    try {
      const result = await uploadMediaImage(file);
      const newPhoto: GalleryPhoto = {
        id: `photo_${Date.now()}`,
        url: result.url,
        tag,
        caption: `${tag.charAt(0).toUpperCase() + tag.slice(1)} view`,
      };
      setGalleryPhotos((prev) => [newPhoto, ...prev]);
      setFeedback({
        section: 'photos',
        type: 'success',
        message: `${tag.charAt(0).toUpperCase() + tag.slice(1)} photo added to gallery. Click "Save Photography" to save.`,
      });
    } catch (err: any) {
      setFeedback({
        section: 'photos',
        type: 'error',
        message: err.message || 'Gallery upload failed.',
      });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryPhoto = (id: string) => {
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <OwnerLayout
      activeRestaurantId={restaurant?.id}
      onSelectRestaurant={(r) => {
        setRestaurant(r);
        setSearchParams({ id: r.id }, { replace: true });
      }}
    >
      <div className="space-y-8 pb-16">
        {/* ============================================================== */}
        {/* HEADER OVERVIEW */}
        {/* ============================================================== */}
        <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#E9A052] bg-[#241A15] px-2.5 py-0.5 rounded-full border border-[#382820]">
                  Restaurant Profile &amp; Identity
                </span>
                <span className="text-[#382820]">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                    restaurant?.verified
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                      : 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {restaurant?.verified ? 'Verified Establishment' : 'Verification Pending'}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EDE5] font-normal tracking-tight">
                {restaurant?.name || 'Restaurant Profile'}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#B6A69A] mt-1 max-w-2xl leading-relaxed">
                Manage your authentic brand identity, location coordinates, 7-day schedule, interior/exterior photography, and compliance status.
              </p>
            </div>

            {restaurant?.slug && (
              <a
                href={`/restaurant/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#241A15] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl text-xs font-semibold text-[#F5EDE5] hover:text-[#E9A052] transition-colors shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E9A052]" />
              </a>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-sans">{feedback.message}</div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[#B6A69A] hover:text-[#F5EDE5] text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 text-center text-sm font-semibold text-[#B6A69A] bg-[#1C1512] border border-[#382820] rounded-2xl">
            Loading restaurant profile...
          </div>
        ) : !restaurant ? (
          <div className="border border-dashed border-[#382820] rounded-2xl p-14 text-center bg-[#1C1512]">
            <Store className="w-10 h-10 text-[#E9A052]/60 mx-auto mb-3 stroke-1" />
            <h2 className="text-base font-serif font-medium text-[#F5EDE5] mb-1">
              No Restaurant Found
            </h2>
            <p className="text-xs text-[#B6A69A] max-w-sm mx-auto">
              You must register a restaurant before managing profile details.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ============================================================== */}
            {/* SECTION E: VERIFICATION & COMPLIANCE STATUS (Top Overview) */}
            {/* ============================================================== */}
            <div
              id="section-verification"
              className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                      E. Verification &amp; Compliance Status
                    </h2>
                    <p className="text-xs text-[#B6A69A]">
                      Current admin vetting status, completeness meter, and missing detail alerts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                      restaurant.status === 'approved'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : restaurant.status === 'pending'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                    }`}
                  >
                    {restaurant.status === 'pending' ? 'Pending Review' : restaurant.status}
                  </span>
                </div>
              </div>

              {/* Completeness Meter */}
              <div className="bg-[#241A15] border border-[#382820] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-medium text-[#F5EDE5]">
                    Profile Completion Score
                  </span>
                  <span className="font-mono font-bold text-[#E9A052]">
                    {completedCount} of {totalCount} Requirements Met ({completionPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-[#1C1512] border border-[#382820] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#E9A052] h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                {/* Missing Details Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                  {missingInfoList.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                        item.resolved
                          ? 'bg-[#1C1512] border-[#382820] text-[#B6A69A]'
                          : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                      }`}
                    >
                      {item.resolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes Box */}
              {restaurant.admin_notes && (
                <div className="p-4 bg-[#241A15] border border-[#382820] rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#E9A052] font-mono uppercase font-bold text-[10px] tracking-wider">
                    <Info className="w-3.5 h-3.5" />
                    <span>Admin Review Notes</span>
                  </div>
                  <p className="text-[#F5EDE5] leading-relaxed">{restaurant.admin_notes}</p>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* SECTION A: BASIC INFORMATION */}
            {/* ============================================================== */}
            <form
              id="section-basic"
              onSubmit={handleSaveBasic}
              className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                      A. Basic Information
                    </h2>
                    <p className="text-xs text-[#B6A69A]">
                      Restaurant brand name, description, cuisine classification, and contact info.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingBasic}
                  className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  {isSavingBasic ? 'Saving...' : 'Save Basic Information'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={150}
                    disabled={isSavingBasic}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    Cuisine / Restaurant Type *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isSavingBasic}
                      className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                    >
                      {CUISINE_OPTIONS.map((c) => (
                        <option key={c} value={c} className="bg-[#1C1512] text-[#F5EDE5]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    About / Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Tell guests about your specialties, heritage, and signature dishes..."
                    disabled={isSavingBasic}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#E9A052]" />
                      <span>Contact Phone *</span>
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={25}
                    placeholder="+91 98300 00000"
                    disabled={isSavingBasic}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#E9A052]" />
                      <span>Contact Email / Website (Optional)</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={200}
                    placeholder="kitchen@example.com or website URL"
                    disabled={isSavingBasic}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>
              </div>
            </form>

            {/* ============================================================== */}
            {/* SECTION B: LOCATION & GOOGLE MAPS */}
            {/* ============================================================== */}
            <form
              id="section-location"
              onSubmit={handleSaveLocation}
              className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                      B. Location &amp; Map Coordinates
                    </h2>
                    <p className="text-xs text-[#B6A69A]">
                      Full postal address, locality, city, and Google Maps pin marker.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingLocation}
                  className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  {isSavingLocation ? 'Saving...' : 'Save Location Details'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                <div className="sm:col-span-12">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    Full Street Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    maxLength={300}
                    placeholder="e.g. 12A, Park Street, Near Camac Street Crossing"
                    disabled={isSavingLocation}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="e.g. Park Street, Salt Lake, New Town"
                    disabled={isSavingLocation}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="e.g. Kolkata"
                    disabled={isSavingLocation}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                  />
                </div>

                {/* Interactive Map Section */}
                <div className="sm:col-span-12 pt-2">
                  <div className="mb-3">
                    <span className="text-xs font-serif font-medium text-[#F5EDE5] block">
                      Google Maps Interactive Pin
                    </span>
                    <p className="text-xs text-[#B6A69A] mt-0.5">
                      Accurate coordinates power distance calculations, Near Me filters, and diner route directions.
                    </p>
                  </div>

                  <OwnerLocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(coords) => {
                      if (coords) {
                        setLatitude(coords.latitude);
                        setLongitude(coords.longitude);
                      } else {
                        setLatitude(null);
                        setLongitude(null);
                      }
                    }}
                    defaultCity={city || 'Kolkata'}
                    defaultArea={area || 'Salt Lake'}
                    disabled={isSavingLocation}
                  />
                </div>
              </div>
            </form>

            {/* ============================================================== */}
            {/* SECTION C: OPENING HOURS */}
            {/* ============================================================== */}
            <form
              id="section-hours"
              onSubmit={handleSaveHours}
              className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                      C. Weekly Opening Hours
                    </h2>
                    <p className="text-xs text-[#B6A69A]">
                      Individual 7-day schedule, closed-day toggles, and opening / closing times.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingHours}
                  className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  {isSavingHours ? 'Saving...' : 'Save Operating Hours'}
                </button>
              </div>

              <div className="divide-y divide-[#382820]">
                {schedule.map((item, idx) => {
                  const dayName = DAY_NAMES[item.day_of_week];
                  return (
                    <div
                      key={item.day_of_week}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="w-32 font-semibold text-[#F5EDE5] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#E9A052]" />
                        <span>{dayName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-[#B6A69A] cursor-pointer hover:text-[#F5EDE5]">
                          <input
                            type="checkbox"
                            checked={item.is_closed}
                            onChange={(e) => {
                              const updated = [...schedule];
                              updated[idx].is_closed = e.target.checked;
                              setSchedule(updated);
                            }}
                            className="rounded border-[#382820] bg-[#241A15] text-[#E9A052] focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span>Closed all day</span>
                        </label>

                        {!item.is_closed && (
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#B6A69A] text-[11px] font-mono">Open:</span>
                            <input
                              type="time"
                              value={item.open_time}
                              onChange={(e) => {
                                const updated = [...schedule];
                                updated[idx].open_time = e.target.value;
                                setSchedule(updated);
                              }}
                              className="border border-[#382820] rounded-xl px-2.5 py-1.5 bg-[#241A15] text-[#F5EDE5] text-xs font-mono focus:outline-none focus:border-[#E9A052]"
                            />
                            <span className="text-[#B6A69A] text-[11px] font-mono">Close:</span>
                            <input
                              type="time"
                              value={item.close_time}
                              onChange={(e) => {
                                const updated = [...schedule];
                                updated[idx].close_time = e.target.value;
                                setSchedule(updated);
                              }}
                              className="border border-[#382820] rounded-xl px-2.5 py-1.5 bg-[#241A15] text-[#F5EDE5] text-xs font-mono focus:outline-none focus:border-[#E9A052]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            {/* ============================================================== */}
            {/* SECTION D: RESTAURANT PHOTOGRAPHY */}
            {/* ============================================================== */}
            <div
              id="section-photos"
              className="bg-[#1C1512] border border-[#382820] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#382820] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif font-medium text-[#F5EDE5]">
                      D. Restaurant Photography &amp; Brand Media
                    </h2>
                    <p className="text-xs text-[#B6A69A]">
                      Logo, cover banner, interior/exterior shots, and diner visual showcase.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePhotos}
                  disabled={isSavingPhotos || isUploadingLogo || isUploadingCover}
                  className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  {isSavingPhotos ? 'Saving...' : 'Save Photography'}
                </button>
              </div>

              {/* Logo & Cover Banner Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Card */}
                <div className="p-4 bg-[#241A15] border border-[#382820] rounded-xl space-y-3">
                  <span className="text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider block">
                    Restaurant Brand Logo
                  </span>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-xl border border-[#382820] bg-[#1C1512] flex items-center justify-center overflow-hidden shrink-0 relative">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Restaurant Logo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.no-logo-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <span
                        className={`no-logo-fallback text-[11px] text-[#B6A69A]/60 text-center px-1 font-mono ${
                          logoUrl ? 'hidden' : 'inline'
                        }`}
                      >
                        No Logo
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1512] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl text-xs font-medium text-[#F5EDE5] hover:bg-[#2C201A] transition-colors">
                        <UploadCloud className="w-3.5 h-3.5 text-[#E9A052]" />
                        <span>{isUploadingLogo ? 'Uploading...' : logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-[#B6A69A]/60">JPEG, PNG, WebP up to 5 MB.</p>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="text-[11px] text-rose-400 hover:underline block cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Banner Card */}
                <div className="p-4 bg-[#241A15] border border-[#382820] rounded-xl space-y-3">
                  <span className="text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider block">
                    Cover Banner Photograph
                  </span>
                  <div className="space-y-2.5">
                    <div className="w-full h-24 rounded-xl border border-[#382820] bg-[#1C1512] flex items-center justify-center overflow-hidden relative">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt="Cover Banner"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.no-cover-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <span
                        className={`no-cover-fallback text-[11px] text-[#B6A69A]/60 font-mono ${
                          coverUrl ? 'hidden' : 'inline'
                        }`}
                      >
                        No Cover Banner
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1512] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl text-xs font-medium text-[#F5EDE5] hover:bg-[#2C201A] transition-colors">
                        <UploadCloud className="w-3.5 h-3.5 text-[#E9A052]" />
                        <span>{isUploadingCover ? 'Uploading...' : coverUrl ? 'Replace Cover' : 'Upload Cover'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverUpload}
                          disabled={isUploadingCover}
                          className="hidden"
                        />
                      </label>
                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => setCoverUrl(null)}
                          className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interior, Exterior & Gallery Photographs */}
              <div className="p-4 sm:p-5 bg-[#241A15] border border-[#382820] rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#382820]">
                  <div>
                    <h3 className="text-sm font-serif font-medium text-[#F5EDE5]">
                      Interior, Exterior &amp; Dining Gallery ({galleryPhotos.length})
                    </h3>
                    <p className="text-xs text-[#B6A69A]">
                      Upload atmospheric photos of your dining hall, kitchen, facade, or signature presentations.
                    </p>
                  </div>

                  {/* Fast upload buttons by category */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['interior', 'exterior', 'ambience', 'food'] as const).map((t) => (
                      <label
                        key={t}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1512] border border-[#382820] hover:border-[#E9A052]/40 rounded-lg text-[11px] font-mono text-[#F5EDE5] hover:text-[#E9A052] transition-colors"
                      >
                        <span>+ {t.charAt(0).toUpperCase() + t.slice(1)}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleGalleryUpload(e, t)}
                          disabled={isUploadingGallery}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {isUploadingGallery && (
                  <div className="p-3 bg-[#1C1512] border border-[#382820] rounded-xl text-xs text-[#E9A052] flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#E9A052] border-t-transparent rounded-full animate-spin" />
                    <span>Uploading photograph to gallery...</span>
                  </div>
                )}

                {galleryPhotos.length === 0 ? (
                  <div className="py-8 border border-dashed border-[#382820] rounded-xl text-center text-xs text-[#B6A69A] bg-[#1C1512]">
                    No gallery photos added yet. Use the tags above (+ Interior, + Exterior, + Ambience, + Food) to showcase your space to guests.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {galleryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-xl overflow-hidden border border-[#382820] bg-[#1C1512] aspect-4/3"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
                          <span className="self-start text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 text-[#E9A052] border border-[#382820]">
                            {photo.tag}
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white truncate max-w-[80%] font-medium">
                              {photo.caption}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryPhoto(photo.id)}
                              className="p-1 rounded-lg bg-black/60 text-[#B6A69A] hover:text-rose-400 hover:bg-black/90 transition-colors cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
