import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insforge, Restaurant } from '../lib/insforge';

export const EditRestaurantPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantId = searchParams.get('id');

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId || !user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error('Restaurant not found or you do not have permission to view it.');
      }

      const res = data as Restaurant;
      setRestaurant(res);
      setName(res.name);
      setDescription(res.description || '');
      setPhone(res.phone);
      setAddress(res.address);
      setArea(res.area);
      setCity(res.city);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load restaurant details.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, user]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (!restaurantId) return;

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
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Update failed. You may not own this restaurant.');
      }

      setRestaurant(data as Restaurant);
      setSuccessMsg('Restaurant details updated successfully.');

      // Log audit
      if (user?.id) {
        await insforge.database.from('audit_logs').insert([
          {
            user_id: user.id,
            entity_type: 'restaurant',
            entity_id: restaurantId,
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

  if (!restaurantId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-slate-600 mb-4">No restaurant ID specified.</p>
        <Link
          to="/owner"
          className="text-xs px-3.5 py-2 bg-slate-900 text-white rounded font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading restaurant details...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Edit restaurant
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update information for <span className="font-semibold text-slate-700">{restaurant?.name}</span>
          </p>
        </div>
        <Link
          to="/owner"
          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-200 rounded"
        >
          Back to Dashboard
        </Link>
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

      {restaurant && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded flex flex-wrap gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Status (Backend Managed):</span>
            <span
              className={`font-semibold uppercase tracking-wider ${
                restaurant.status === 'approved'
                  ? 'text-emerald-700'
                  : restaurant.status === 'pending'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {restaurant.status}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Verification:</span>
            <span className="font-medium text-slate-800">
              {restaurant.verified ? 'Verified' : 'Unverified (Admin review required)'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Public URL Slug:</span>
            <span className="font-mono text-slate-800">/restaurant/{restaurant.slug}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Restaurant name *
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
            type="button"
            onClick={() => navigate('/owner')}
            className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
          >
            {isSubmitting ? 'Updating...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
