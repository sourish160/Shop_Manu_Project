import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { insforge, Restaurant, Category, Food, FoodVariant, adminUpdateRestaurantStatus } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { Store, CheckCircle, XCircle, AlertOctagon, RefreshCw, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { RestaurantMap } from '../components/maps/RestaurantMap';
import { useSEO } from '../hooks/useSEO';

export const AdminRestaurantsPage: React.FC = () => {
  useSEO({
    title: 'Admin Restaurant Moderation',
    noIndex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') || 'all';
  const targetId = searchParams.get('id');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ name: string; email: string; phone: string | null } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    actionType: 'approve' | 'reject' | 'suspend' | 'restore';
    targetStatus: 'approved' | 'rejected' | 'suspended';
    verified: boolean;
    reason: string;
  }>({
    isOpen: false,
    actionType: 'approve',
    targetStatus: 'approved',
    verified: false,
    reason: '',
  });

  // 1. Fetch Restaurants List
  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let query = insforge.database
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const items = (data || []) as Restaurant[];
      setRestaurants(items);

      // If id is in URL, select that restaurant
      if (targetId) {
        const found = items.find((r) => r.id === targetId);
        if (found) {
          setSelectedRestaurant(found);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, targetId]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && actionModal.isOpen) {
        setActionModal((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionModal.isOpen]);

  // 2. Fetch Restaurant Detailed Inspection Data
  const loadInspectionDetails = useCallback(async (res: Restaurant) => {
    setSelectedRestaurant(res);
    setIsLoadingDetails(true);
    setOwnerProfile(null);
    setCategories([]);
    setFoods([]);

    try {
      // Fetch owner profile for administrative contact
      const { data: prof } = await insforge.database
        .from('profiles')
        .select('name, email, phone')
        .eq('id', res.owner_id)
        .maybeSingle();

      if (prof) setOwnerProfile(prof);

      // Fetch categories & active foods in parallel
      const [catRes, foodRes] = await Promise.all([
        insforge.database
          .from('categories')
          .select('*')
          .eq('restaurant_id', res.id)
          .order('sort_order', { ascending: true }),
        insforge.database
          .from('foods')
          .select('*')
          .eq('restaurant_id', res.id)
          .order('name', { ascending: true }),
      ]);

      const loadedCats = (catRes.data || []) as Category[];
      const loadedFoods = (foodRes.data || []) as Food[];

      if (loadedFoods.length > 0) {
        const foodIds = loadedFoods.map((f) => f.id);
        const { data: varData } = await insforge.database
          .from('food_variants')
          .select('*')
          .in('food_id', foodIds);

        const variantsByFood = new Map<string, FoodVariant[]>();
        ((varData || []) as FoodVariant[]).forEach((v) => {
          const list = variantsByFood.get(v.food_id) || [];
          list.push(v);
          variantsByFood.set(v.food_id, list);
        });

        loadedFoods.forEach((f) => {
          f.variants = variantsByFood.get(f.id) || [];
        });
      }

      setCategories(loadedCats);
      setFoods(loadedFoods);
    } catch (err) {
      console.error('Inspection load error:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Open inspection when selectedRestaurant changes
  useEffect(() => {
    if (selectedRestaurant && targetId === selectedRestaurant.id) {
      loadInspectionDetails(selectedRestaurant);
    }
  }, [selectedRestaurant, targetId, loadInspectionDetails]);

  // Handle Intentional Status Actions
  const handleOpenActionModal = (
    actionType: 'approve' | 'reject' | 'suspend' | 'restore',
    targetStatus: 'approved' | 'rejected' | 'suspended',
    verifiedDefault: boolean = false
  ) => {
    setActionModal({
      isOpen: true,
      actionType,
      targetStatus,
      verified: verifiedDefault,
      reason: '',
    });
  };

  const handleExecuteStatusChange = async () => {
    if (!selectedRestaurant) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (
      (actionModal.actionType === 'reject' || actionModal.actionType === 'suspend') &&
      !actionModal.reason.trim()
    ) {
      setErrorMsg(`Please specify an administrative internal reason for this ${actionModal.actionType}.`);
      return;
    }

    setIsProcessing(true);
    try {
      await adminUpdateRestaurantStatus(
        selectedRestaurant.id,
        actionModal.targetStatus,
        actionModal.verified,
        actionModal.reason.trim() || null
      );

      setSuccessMsg(
        `Restaurant "${selectedRestaurant.name}" successfully updated to ${actionModal.targetStatus.toUpperCase()}.`
      );
      setActionModal((prev) => ({ ...prev, isOpen: false }));

      // Reload list and details
      await loadRestaurants();
      const updatedRes = {
        ...selectedRestaurant,
        status: actionModal.targetStatus,
        verified: actionModal.verified,
        admin_notes: actionModal.reason.trim() || selectedRestaurant.admin_notes,
      };
      setSelectedRestaurant(updatedRes);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Administrative update failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Restaurant Verification & Moderation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review restaurant applications, manage approval statuses, and verify authentic establishments.
            </p>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSearchParams({ status: st })}
                className={`text-xs px-3 py-1.5 rounded font-medium capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Restaurants Table List (5 Columns on Large screens) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Restaurants ({restaurants.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading restaurants...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No restaurants matching filter &quot;{filterStatus}&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[75vh] overflow-y-auto">
                {restaurants.map((res) => {
                  const isSelected = selectedRestaurant?.id === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(res);
                        loadInspectionDetails(res);
                        setSearchParams({ status: filterStatus, id: res.id });
                      }}
                      className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-100/90 border-l-4 border-l-slate-900'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{res.name}</span>
                          {res.verified && (
                            <span title="Verified establishment">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {res.area}, {res.city}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Created {formatFreshnessDate(res.created_at)}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          res.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : res.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : res.status === 'suspended'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {res.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Restaurant Detail & Moderation Panel (7 Columns) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 shadow-xs">
            {!selectedRestaurant ? (
              <div className="py-24 text-center text-xs text-slate-400">
                <Store className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                Select a restaurant from the left list to review establishment details and manage verification.
              </div>
            ) : isLoadingDetails ? (
              <div className="py-24 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading detailed menu and location verification...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {selectedRestaurant.name}
                        {selectedRestaurant.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        /restaurant/{selectedRestaurant.slug}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                        selectedRestaurant.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedRestaurant.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : selectedRestaurant.status === 'suspended'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {selectedRestaurant.status}
                    </span>
                  </div>

                  {selectedRestaurant.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {selectedRestaurant.description}
                    </p>
                  )}

                  {selectedRestaurant.admin_notes && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                      <span className="font-semibold text-slate-700 block mb-0.5">Internal Admin Notes:</span>
                      <span className="text-slate-600">{selectedRestaurant.admin_notes}</span>
                    </div>
                  )}
                </div>

                {/* Establishment Verification Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Physical Address
                    </span>
                    <div className="font-medium text-slate-900">{selectedRestaurant.address}</div>
                    <div className="text-slate-600 mt-0.5">{selectedRestaurant.area}, {selectedRestaurant.city}</div>
                    <div className="mt-2 text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedRestaurant.phone}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Registered Owner (Admin View)
                    </span>
                    <div className="font-medium text-slate-900">{ownerProfile?.name || 'Owner Profile'}</div>
                    <div className="text-slate-600 mt-0.5">{ownerProfile?.email || 'Email not loaded'}</div>
                    {ownerProfile?.phone && (
                      <div className="text-slate-600 mt-0.5">Phone: {ownerProfile.phone}</div>
                    )}
                    <div className="text-[10px] font-mono text-slate-400 mt-1">ID: {selectedRestaurant.owner_id}</div>
                  </div>
                </div>

                {/* Geographic Map Preview */}
                <div className="border border-slate-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                      Location Verification
                    </span>
                    {selectedRestaurant.latitude && selectedRestaurant.longitude ? (
                      <span className="text-[11px] font-mono text-slate-500">
                        {selectedRestaurant.latitude}, {selectedRestaurant.longitude}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Coordinates not recorded</span>
                    )}
                  </div>

                  <RestaurantMap
                    latitude={selectedRestaurant.latitude}
                    longitude={selectedRestaurant.longitude}
                    restaurantName={selectedRestaurant.name}
                    address={selectedRestaurant.address}
                    area={selectedRestaurant.area}
                    city={selectedRestaurant.city}
                    zoom={15}
                  />
                </div>

                {/* Menu & Variants Inspection */}
                <div className="border border-slate-200 rounded p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                      Menu Inspection ({foods.length} items across {categories.length} categories)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Last menu update: {formatFreshnessDate(selectedRestaurant.updated_at)}
                    </span>
                  </div>

                  {foods.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No menu items added by owner yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                      {foods.map((food) => (
                        <div key={food.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-slate-900">{food.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {food.veg_type === 'veg' ? 'Veg' : 'Non-Veg'}
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {(food.variants || []).map((v) => `${v.name}: ₹${v.price}`).join(', ') || 'No variants'}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              food.available
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {food.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Administrative Status Actions */}
                <div className="pt-4 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-3">
                    Intentional Moderation Actions
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {/* Approve Action */}
                    {selectedRestaurant.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('approve', 'approved', true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve & Verify
                      </button>
                    )}

                    {/* Restore Action */}
                    {selectedRestaurant.status === 'suspended' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('restore', 'approved', selectedRestaurant.verified)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Restore to Public
                      </button>
                    )}

                    {/* Suspend Action */}
                    {selectedRestaurant.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('suspend', 'suspended', selectedRestaurant.verified)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 text-white rounded text-xs font-semibold hover:bg-amber-800 transition-colors shadow-xs"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Suspend Restaurant
                      </button>
                    )}

                    {/* Reject Action */}
                    {selectedRestaurant.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('reject', 'rejected', false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white rounded text-xs font-semibold hover:bg-rose-800 transition-colors shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Application
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Moderation Dialog */}
      {actionModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
        >
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Status Transition: {actionModal.targetStatus.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to change the status of &quot;{selectedRestaurant?.name}&quot; to{' '}
                <strong className="text-slate-800">{actionModal.targetStatus}</strong>.
              </p>
            </div>

            {actionModal.actionType === 'approve' && (
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={actionModal.verified}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, verified: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span className="font-medium">Grant &quot;Verified&quot; establishment trust badge</span>
              </label>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Notes / Reason {actionModal.actionType !== 'approve' && '*'}
              </label>
              <textarea
                rows={3}
                value={actionModal.reason}
                onChange={(e) =>
                  setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Internal explanation recorded in audit log..."
                className="w-full text-xs border border-slate-300 rounded p-2.5 focus:outline-none focus:border-slate-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={isProcessing}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusChange}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 shadow-xs"
              >
                {isProcessing ? 'Updating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
