import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerNav } from '../components/OwnerNav';
import { insforge, Restaurant, RestaurantHours, uploadMediaImage } from '../lib/insforge';
import { DAY_NAMES } from '../utils/operatingHours';

interface DayScheduleForm {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export const EditRestaurantPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantId = searchParams.get('id');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Operating Hours fields
  const [schedule, setSchedule] = useState<DayScheduleForm[]>(
    DAY_NAMES.map((_, i) => ({
      day_of_week: i,
      open_time: '10:00',
      close_time: '22:00',
      is_closed: false,
    }))
  );
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSuccessMsg, setHoursSuccessMsg] = useState<string | null>(null);
  const [hoursErrorMsg, setHoursErrorMsg] = useState<string | null>(null);

  // Load owner's restaurants and select current
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
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
        if (found) active = found;
      } else {
        setSearchParams({ id: active.id }, { replace: true });
      }

      setRestaurant(active);
      setName(active.name);
      setDescription(active.description || '');
      setPhone(active.phone);
      setAddress(active.address);
      setArea(active.area);
      setCity(active.city);
      setLogoUrl(active.logo_url);
      setCoverUrl(active.cover_url);

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
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load restaurant profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurantId, setSearchParams]);

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setHoursErrorMsg(null);
    setHoursSuccessMsg(null);
    setIsSavingHours(true);

    try {
      const rows = schedule.map((item) => ({
        restaurant_id: restaurant.id,
        day_of_week: item.day_of_week,
        open_time: item.is_closed ? null : (item.open_time ? `${item.open_time}:00` : '10:00:00'),
        close_time: item.is_closed ? null : (item.close_time ? `${item.close_time}:00` : '22:00:00'),
        is_closed: item.is_closed,
        updated_at: new Date().toISOString(),
      }));

      await insforge.database
        .from('restaurant_hours')
        .delete()
        .eq('restaurant_id', restaurant.id);

      const { error: insertErr } = await insforge.database
        .from('restaurant_hours')
        .insert(rows);

      if (insertErr) throw new Error(insertErr.message);

      setHoursSuccessMsg('Operating hours updated successfully.');
    } catch (err: unknown) {
      setHoursErrorMsg(err instanceof Error ? err.message : 'Failed to save operating hours.');
    } finally {
      setIsSavingHours(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setErrorMsg(null);
    try {
      const result = await uploadMediaImage(file);
      setLogoUrl(result.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logo upload failed.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    setErrorMsg(null);
    try {
      const result = await uploadMediaImage(file);
      setCoverUrl(result.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cover upload failed.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || name.trim().length < 2 || name.trim().length > 150) {
      setErrorMsg('Restaurant name is required (2 to 150 characters).');
      return;
    }

    if (!phone.trim() || phone.trim().length < 7 || phone.trim().length > 25) {
      setErrorMsg('Valid phone number is required (7 to 25 characters).');
      return;
    }

    if (!address.trim() || address.trim().length < 5 || address.trim().length > 300) {
      setErrorMsg('Address is required (5 to 300 characters).');
      return;
    }

    if (!area.trim() || area.trim().length < 2 || area.trim().length > 100) {
      setErrorMsg('Area is required (2 to 100 characters).');
      return;
    }

    if (!city.trim() || city.trim().length < 2 || city.trim().length > 100) {
      setErrorMsg('City is required (2 to 100 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim(),
          address: address.trim(),
          area: area.trim(),
          city: city.trim(),
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setRestaurant(data as Restaurant);
      setSuccessMsg('Restaurant profile updated successfully.');

      // Record in audit log
      if (user?.id) {
        await insforge.database.from('audit_logs').insert([
          {
            user_id: user.id,
            entity_type: 'restaurant',
            entity_id: restaurant.id,
            action: 'update',
            new_data: { name: name.trim(), area: area.trim(), city: city.trim() },
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <OwnerNav />
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Restaurant Profile
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit your restaurant details, contact information, and media.
            </p>
          </div>
          {restaurants.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Switch:</span>
              <select
                value={restaurant?.id || ''}
                onChange={(e) => setSearchParams({ id: e.target.value })}
                className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
            {successMsg}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading restaurant profile...
          </div>
        ) : !restaurant ? (
          <div className="border border-dashed border-slate-300 rounded p-12 text-center bg-white">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              No restaurant found
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              You must register a restaurant before managing its profile.
            </p>
            <button
              onClick={() => navigate('/owner/restaurant/new')}
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
            >
              Create restaurant
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status & Security Banner */}
            <div className="border border-slate-200 bg-white rounded p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                    Status
                  </span>
                  <span
                    className={`font-semibold uppercase tracking-wider text-xs ${
                      restaurant.status === 'approved'
                        ? 'text-emerald-700'
                        : restaurant.status === 'pending'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {restaurant.status === 'pending' ? 'Pending review' : restaurant.status}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                    Verification
                  </span>
                  <span className="font-medium text-slate-700">
                    {restaurant.verified ? 'Verified' : 'Unverified (Admin review required)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                    Slug Identifier
                  </span>
                  <span className="font-mono text-slate-800 text-xs">
                    /restaurant/{restaurant.slug}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                    Public Page
                  </span>
                  {restaurant.status === 'approved' ? (
                    <a
                      href={`/restaurant/${restaurant.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline text-xs flex items-center gap-1"
                    >
                      View Live Menu &rarr;
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Available once approved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media Uploads Card */}
            <div className="border border-slate-200 bg-white rounded p-6 shadow-sm space-y-6">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Restaurant Media
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Restaurant Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Restaurant Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 text-center px-1">
                          No Logo
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="inline-block cursor-pointer px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo || isSubmitting}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        JPEG, PNG, or WebP. Max 5 MB.
                      </p>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="text-[11px] text-red-600 hover:underline block"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Cover Banner
                  </label>
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt="Cover Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No Cover Image
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="inline-block cursor-pointer px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        {isUploadingCover ? 'Uploading...' : 'Upload Cover'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverUpload}
                          disabled={isUploadingCover || isSubmitting}
                          className="hidden"
                        />
                      </label>
                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => setCoverUrl(null)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General Information Card */}
            <div className="border border-slate-200 bg-white rounded p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                General Details
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={150}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={25}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    maxLength={100}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Area *
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    maxLength={100}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    maxLength={300}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>

          {/* Operating Hours Management Card */}
          <form
            onSubmit={handleSaveHours}
            className="border border-slate-200 bg-white rounded p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Weekly Operating Hours
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your restaurant opening and closing hours for public display.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSavingHours}
                className="self-start sm:self-auto px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
              >
                {isSavingHours ? 'Saving hours...' : 'Save Operating Hours'}
              </button>
            </div>

            {hoursSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                {hoursSuccessMsg}
              </div>
            )}

            {hoursErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {hoursErrorMsg}
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {schedule.map((item, idx) => {
                const dayName = DAY_NAMES[item.day_of_week];
                return (
                  <div
                    key={item.day_of_week}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="w-32 font-semibold text-slate-800">
                      {dayName}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_closed}
                          onChange={(e) => {
                            const updated = [...schedule];
                            updated[idx].is_closed = e.target.checked;
                            setSchedule(updated);
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <span>Closed all day</span>
                      </label>

                      {!item.is_closed && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Open:</span>
                          <input
                            type="time"
                            value={item.open_time}
                            onChange={(e) => {
                              const updated = [...schedule];
                              updated[idx].open_time = e.target.value;
                              setSchedule(updated);
                            }}
                            className="border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                          />
                          <span className="text-slate-400">Close:</span>
                          <input
                            type="time"
                            value={item.close_time}
                            onChange={(e) => {
                              const updated = [...schedule];
                              updated[idx].close_time = e.target.value;
                              setSchedule(updated);
                            }}
                            className="border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  );
};
