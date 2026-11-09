import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { insforge, Restaurant, Category, Food, FoodVariant, adminUpdateRestaurantStatus } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { Store, CheckCircle, XCircle, AlertOctagon, RefreshCw, Phone, ShieldCheck, AlertCircle, MapPin, Clock } from 'lucide-react';
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
      let query = insforge.database.from('restaurants').select('*').order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const items = (data || []) as Restaurant[];
      setRestaurants(items);

      // If URL has specific target ID, auto-select it
      if (targetId) {
        const found = items.find((r) => r.id === targetId);
        if (found) {
          setSelectedRestaurant(found);
          loadInspectionDetails(found);
        }
      } else if (items.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(items[0]);
        loadInspectionDetails(items[0]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, targetId]);

  // 2. Fetch Detailed Verification Inspection Data
  const loadInspectionDetails = async (restaurant: Restaurant) => {
    setIsLoadingDetails(true);
    try {
      // Fetch categories
      const { data: cats } = await insforge.database
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true });

      setCategories((cats || []) as Category[]);

      // Fetch food items
      const { data: dishes } = await insforge.database
        .from('foods')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('name', { ascending: true });

      const foodsList = (dishes || []) as Food[];

      // Fetch variants for all foods
      if (foodsList.length > 0) {
        const foodIds = foodsList.map((f) => f.id);
        const { data: vars } = await insforge.database
          .from('food_variants')
          .select('*')
          .in('food_id', foodIds);

        const variantsList = (vars || []) as FoodVariant[];
        const enrichedFoods = foodsList.map((f) => ({
          ...f,
          variants: variantsList.filter((v) => v.food_id === f.id),
        }));
        setFoods(enrichedFoods);
      } else {
        setFoods([]);
      }

      // Fetch owner profile for administrative contact
      const { data: owner } = await insforge.database
        .from('profiles')
        .select('name, email, phone')
        .eq('id', restaurant.owner_id)
        .maybeSingle();

      if (owner) {
        setOwnerProfile(owner as { name: string; email: string; phone: string | null });
      } else {
        setOwnerProfile(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load restaurant details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Open Modal Handler
  const handleOpenActionModal = (
    actionType: 'approve' | 'reject' | 'suspend' | 'restore',
    targetStatus: 'approved' | 'rejected' | 'suspended',
    verified: boolean
  ) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActionModal({
      isOpen: true,
      actionType,
      targetStatus,
      verified,
      reason: '',
    });
  };

  // Execute Moderation Status Change
  const handleExecuteStatusChange = async () => {
    if (!selectedRestaurant) return;

    if (actionModal.actionType !== 'approve' && !actionModal.reason.trim()) {
      setErrorMsg(`Please specify an administrative internal reason for this ${actionModal.actionType}.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await adminUpdateRestaurantStatus(
        selectedRestaurant.id,
        actionModal.targetStatus,
        actionModal.verified,
        actionModal.reason.trim()
      );

      setSuccessMsg(
        `Successfully updated status of "${selectedRestaurant.name}" to ${actionModal.targetStatus}. Audit event logged.`
      );
      setActionModal((prev) => ({ ...prev, isOpen: false }));

      // Update local state
      setSelectedRestaurant((prev) =>
        prev
          ? {
              ...prev,
              status: actionModal.targetStatus,
              verified: actionModal.verified,
              admin_notes: actionModal.reason.trim() || selectedRestaurant.admin_notes,
            }
          : null
      );
      loadRestaurants();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Administrative update failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0807] text-[#FAF8F5] pb-20 relative">
      {/* Background Radial Glow */}
      <div
        className="absolute top-0 inset-x-0 h-[480px] pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(217,138,72,0.07)_0%,transparent_75%)]"
        aria-hidden="true"
      />

      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-cream-200/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">
                Establishment Directory
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-cream-100 tracking-tight">
              Restaurant Verification & Moderation
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/60 mt-1 max-w-2xl font-sans leading-relaxed">
              Vetting pipeline, establishment credential verification, and status control across Kolkata kitchens.
            </p>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1">
            {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSearchParams({ status: st })}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-mono uppercase tracking-wider transition-all duration-200 capitalize shrink-0 cursor-pointer ${
                  filterStatus === st
                    ? 'bg-amber-400 text-[#0A0807] font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                    : 'bg-[#181310] border border-cream-200/15 text-cream-200/70 hover:text-cream-100 hover:border-amber-400/40'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Restaurants Table List (5 Columns on Large screens) */}
          <div className="lg:col-span-5 editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-cream-200/10 bg-[#16110E] flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-widest">
                Restaurants ({restaurants.length})
              </span>
              <span className="text-[11px] font-mono text-cream-200/40 uppercase">Click to inspect</span>
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-xs text-cream-200/50">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                <span className="font-mono uppercase tracking-wider text-amber-300">Loading directory...</span>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="p-16 text-center text-xs text-cream-200/40 font-sans">
                No restaurants matching filter &quot;{filterStatus}&quot;.
              </div>
            ) : (
              <div className="divide-y divide-cream-200/10 max-h-[75vh] overflow-y-auto scrollbar-thin">
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
                      className={`w-full text-left p-4 transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/10 border-l-4 border-l-amber-400 text-cream-100'
                          : 'hover:bg-cream-100/[0.03]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-serif font-normal text-cream-100 flex items-center gap-2 truncate">
                          <span>{res.name}</span>
                          {res.verified && (
                            <span title="Verified establishment" className="shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-cream-200/60 mt-1 font-sans truncate">
                          {res.area}, {res.city}
                        </div>
                        <div className="text-[10px] font-mono text-cream-200/40 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cream-200/40" />
                          <span>Created {formatFreshnessDate(res.created_at)}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                          res.status === 'approved'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/35'
                            : res.status === 'pending'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-500/35'
                            : res.status === 'suspended'
                            ? 'bg-cream-100/10 text-cream-200/70 border-cream-200/20'
                            : 'bg-rose-950/70 text-rose-300 border-rose-500/35'
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
          <div className="lg:col-span-7 editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {!selectedRestaurant ? (
              <div className="py-28 text-center text-xs text-cream-200/40 font-sans">
                <Store className="w-10 h-10 mx-auto mb-3 text-cream-200/20 stroke-[1.5]" />
                <p className="text-sm text-cream-200/70 font-medium">Select a restaurant to inspect</p>
                <p className="text-xs text-cream-200/40 mt-1">Review credentials, map coordinates, and manage verification status.</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="py-28 text-center text-xs text-cream-200/50">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                <span className="font-mono uppercase tracking-wider text-amber-300">Loading establishment dossier...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="border-b border-cream-200/10 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-normal text-cream-100 tracking-tight flex items-center gap-2.5">
                        <span>{selectedRestaurant.name}</span>
                        {selectedRestaurant.verified && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </h2>
                      <div className="text-xs text-amber-300/70 font-mono mt-1">
                        /restaurant/{selectedRestaurant.slug}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        selectedRestaurant.status === 'approved'
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/35'
                          : selectedRestaurant.status === 'pending'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-500/35'
                          : selectedRestaurant.status === 'suspended'
                          ? 'bg-cream-100/10 text-cream-200/70 border-cream-200/20'
                          : 'bg-rose-950/70 text-rose-300 border-rose-500/35'
                      }`}
                    >
                      {selectedRestaurant.status}
                    </span>
                  </div>

                  {selectedRestaurant.description && (
                    <p className="text-xs sm:text-[13px] text-cream-200/70 mt-3 leading-relaxed font-sans">
                      {selectedRestaurant.description}
                    </p>
                  )}

                  {selectedRestaurant.admin_notes && (
                    <div className="mt-4 p-4 bg-[#181310] border border-cream-200/10 rounded-2xl text-xs">
                      <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] block mb-1 font-semibold">
                        Internal Admin Notes:
                      </span>
                      <span className="text-cream-200/80 font-sans leading-relaxed">{selectedRestaurant.admin_notes}</span>
                    </div>
                  )}
                </div>

                {/* Establishment Verification Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-cream-200/10 rounded-2xl p-4 bg-[#181310]">
                    <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] block mb-1.5 font-semibold">
                      Physical Address
                    </span>
                    <div className="font-serif text-sm font-normal text-cream-100">{selectedRestaurant.address}</div>
                    <div className="text-cream-200/60 mt-1 font-sans">{selectedRestaurant.area}, {selectedRestaurant.city}</div>
                    <div className="mt-2 text-cream-200/80 flex items-center gap-2 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedRestaurant.phone}</span>
                    </div>
                  </div>

                  <div className="border border-cream-200/10 rounded-2xl p-4 bg-[#181310]">
                    <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] block mb-1.5 font-semibold">
                      Registered Owner (Admin View)
                    </span>
                    <div className="font-serif text-sm font-normal text-cream-100">{ownerProfile?.name || 'Owner Profile'}</div>
                    <div className="text-cream-200/60 mt-1 font-sans">{ownerProfile?.email || 'Email not loaded'}</div>
                    {ownerProfile?.phone && (
                      <div className="text-cream-200/60 mt-1 font-mono text-[11px]">Phone: {ownerProfile.phone}</div>
                    )}
                    <div className="text-[10px] font-mono text-cream-200/40 mt-1.5 truncate">
                      ID: {selectedRestaurant.owner_id}
                    </div>
                  </div>
                </div>

                {/* Geographic Map Preview */}
                <div className="border border-cream-200/10 rounded-2xl p-4 bg-[#181310] overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>Location Verification</span>
                    </span>
                    {selectedRestaurant.latitude && selectedRestaurant.longitude ? (
                      <span className="text-[11px] font-mono text-cream-200/50">
                        {selectedRestaurant.latitude}, {selectedRestaurant.longitude}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-cream-200/40">Coordinates not recorded</span>
                    )}
                  </div>

                  <div className="rounded-xl overflow-hidden border border-cream-200/10">
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
                </div>

                {/* Menu & Variants Inspection */}
                <div className="border border-cream-200/10 rounded-2xl p-5 bg-[#181310]">
                  <div className="flex items-center justify-between border-b border-cream-200/10 pb-3 mb-3">
                    <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] font-semibold">
                      Menu Inspection ({foods.length} items across {categories.length} categories)
                    </span>
                    <span className="text-[11px] font-mono text-cream-200/40">
                      Updated: {formatFreshnessDate(selectedRestaurant.updated_at)}
                    </span>
                  </div>

                  {foods.length === 0 ? (
                    <div className="py-6 text-center text-xs text-cream-200/40 font-sans">
                      No menu items added by owner yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-cream-200/10 max-h-56 overflow-y-auto pr-1">
                      {foods.map((food) => (
                        <div key={food.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                          <div className="min-w-0">
                            <span className="font-serif text-sm font-normal text-cream-100">{food.name}</span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/50 ml-2">
                              {food.veg_type === 'veg' ? 'Veg' : 'Non-Veg'}
                            </span>
                            <div className="text-[11px] text-amber-300/80 font-mono mt-0.5 truncate">
                              {(food.variants || []).map((v) => `${v.name}: ₹${v.price}`).join(' · ') || 'No variants'}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              food.available
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/35'
                                : 'bg-cream-100/10 text-cream-200/60 border border-cream-200/15'
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
                <div className="pt-5 border-t border-cream-200/10">
                  <span className="font-mono text-xs uppercase tracking-wider text-cream-200/60 block mb-3 font-semibold">
                    Intentional Moderation Actions
                  </span>

                  <div className="flex flex-wrap gap-3">
                    {/* Approve Action */}
                    {selectedRestaurant.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('approve', 'approved', true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve & Verify</span>
                      </button>
                    )}

                    {/* Restore Action */}
                    {selectedRestaurant.status === 'suspended' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('restore', 'approved', selectedRestaurant.verified)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-[#E8A856] text-[#0A0807] rounded-xl text-xs font-sans font-bold uppercase tracking-wider hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg hover:shadow-amber-400/25 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Restore to Public</span>
                      </button>
                    )}

                    {/* Suspend Action */}
                    {selectedRestaurant.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('suspend', 'suspended', selectedRestaurant.verified)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider hover:bg-amber-900/60 transition-all shadow-md cursor-pointer"
                      >
                        <AlertOctagon className="w-4 h-4" />
                        <span>Suspend Restaurant</span>
                      </button>
                    )}

                    {/* Reject Action */}
                    {selectedRestaurant.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal('reject', 'rejected', false)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider hover:bg-rose-900/60 transition-all shadow-md cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Application</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation & Moderation Dialog */}
      {actionModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="bg-[#140F0D] rounded-3xl border border-cream-200/15 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-cream-100">
            <div>
              <h3 className="font-serif text-xl font-normal text-cream-100">
                Confirm Status Transition: <span className="text-amber-400 font-mono text-sm uppercase">{actionModal.targetStatus}</span>
              </h3>
              <p className="text-xs text-cream-200/70 mt-1.5 leading-relaxed font-sans">
                You are about to change the status of &quot;{selectedRestaurant?.name}&quot; to{' '}
                <strong className="text-amber-300 font-mono">{actionModal.targetStatus}</strong>.
              </p>
            </div>

            {actionModal.actionType === 'approve' && (
              <label className="flex items-center space-x-2.5 text-xs text-cream-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={actionModal.verified}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, verified: e.target.checked }))
                  }
                  className="rounded border-cream-200/30 text-amber-500 focus:ring-0 bg-[#1C1512]"
                />
                <span className="font-medium font-sans">Grant &quot;Verified&quot; establishment trust badge</span>
              </label>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-cream-200/70 mb-1.5 font-semibold">
                Administrative Notes / Reason {actionModal.actionType !== 'approve' && '*'}
              </label>
              <textarea
                rows={3}
                value={actionModal.reason}
                onChange={(e) =>
                  setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Internal explanation recorded in audit log..."
                className="w-full text-xs font-sans bg-[#1C1512] border border-cream-200/15 rounded-xl p-3 text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-amber-400/60 leading-relaxed"
              />
            </div>

            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-cream-200/10">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={isProcessing}
                className="px-4 py-2 border border-cream-200/15 rounded-xl text-xs font-mono uppercase tracking-wider text-cream-200 hover:text-cream-100 hover:bg-cream-100/[0.04] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusChange}
                disabled={isProcessing}
                className="px-5 py-2 bg-gradient-to-r from-amber-400 to-[#E8A856] text-[#0A0807] rounded-xl text-xs font-sans font-bold uppercase tracking-wider hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 transition-all shadow-md cursor-pointer"
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
