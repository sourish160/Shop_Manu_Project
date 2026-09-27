import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { OwnerLocationPicker } from '../components/maps/OwnerLocationPicker';
import { validateCoordinates } from '../utils/geolocation';
import { useSEO } from '../hooks/useSEO';

export const NewRestaurantPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'Create Restaurant',
    noIndex: true,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 150) {
      setErrorMsg('Restaurant name is required (2 to 150 characters).');
      return;
    }

    if (description.trim() && description.trim().length > 2000) {
      setErrorMsg('Description must not exceed 2000 characters.');
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

    // Coordinate validation if provided
    if (latitude !== null && longitude !== null) {
      if (!validateCoordinates(Number(latitude), Number(longitude))) {
        setErrorMsg('Latitude must be between -90 and 90; longitude must be between -180 and 180.');
        return;
      }
    } else if ((latitude === null && longitude !== null) || (latitude !== null && longitude === null)) {
      setErrorMsg('Both latitude and longitude must be provided together, or both cleared.');
      return;
    }

    if (!user) {
      setErrorMsg('You must be signed in as an owner.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .insert([
          {
            owner_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            phone: phone.trim(),
            address: address.trim(),
            area: area.trim(),
            city: city.trim(),
            latitude: latitude !== null ? Number(latitude) : null,
            longitude: longitude !== null ? Number(longitude) : null,
            status: 'pending',
            verified: false,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add audit log entry
      if (data?.id) {
        await insforge.database.from('audit_logs').insert([
          {
            user_id: user.id,
            entity_type: 'restaurant',
            entity_id: data.id,
            action: 'create',
            new_data: {
              name: name.trim(),
              area: area.trim(),
              city: city.trim(),
              latitude: latitude !== null ? Number(latitude) : null,
              longitude: longitude !== null ? Number(longitude) : null,
            },
          },
        ]);
      }

      navigate('/owner', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Create restaurant
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register a new restaurant under your owner profile.
          </p>
        </div>
        <Link
          to="/owner"
          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-200 rounded"
        >
          Cancel
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="restaurant-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Restaurant name *
          </label>
          <input
            id="restaurant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Biryani Kitchen"
            required
            maxLength={150}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">Max 150 characters</span>
        </div>

        <div>
          <label htmlFor="restaurant-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            id="restaurant-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of cuisine, specialties, or dining experience..."
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">Optional, max 2000 characters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="restaurant-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone *
            </label>
            <input
              id="restaurant-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98301 23456"
              required
              maxLength={25}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="restaurant-city" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City *
            </label>
            <input
              id="restaurant-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kolkata"
              required
              maxLength={100}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="restaurant-area" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Area *
            </label>
            <input
              id="restaurant-area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Salt Lake, Sector V"
              required
              maxLength={100}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="restaurant-address" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Address *
            </label>
            <input
              id="restaurant-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block EP & GP, Sector V"
              required
              maxLength={300}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Geographic Coordinates & Google Maps Pin (Optional upon registration) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Geographic Coordinates & Google Maps Pin (Optional)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pin your restaurant location on Google Maps for customer map view, Near Me geographic search, and navigation directions. You can also adjust this anytime later.
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
            disabled={isSubmitting}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <Link
            to="/owner"
            className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
};
