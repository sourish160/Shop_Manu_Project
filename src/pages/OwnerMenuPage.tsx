import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerNav } from '../components/OwnerNav';
import {
  insforge,
  Restaurant,
  Category,
  Food,
  FoodVariant,
  FoodAddon,
  Combo,
  ComboItem,
} from '../lib/insforge';
import { useSEO } from '../hooks/useSEO';
import { sanitizeErrorMessage } from '../utils/errorHandler';
import { getFreshnessStatus } from '../utils/freshness';

// Subcomponents
import { FoodCard } from '../components/menu/FoodCard';
import { ComboCard } from '../components/menu/ComboCard';
import { FoodEditorModal, FoodFormData } from '../components/menu/FoodEditorModal';
import { ComboEditorModal, ComboFormData } from '../components/menu/ComboEditorModal';
import { CategoryModal } from '../components/menu/CategoryModal';
import { CategoryReorderModal } from '../components/menu/CategoryReorderModal';
import { AddonsManagerModal } from '../components/menu/AddonsManagerModal';
import { PriceHistoryModal } from '../components/menu/PriceHistoryModal';
import { BulkActionsBar } from '../components/menu/BulkActionsBar';
import { BulkMoveModal } from '../components/menu/BulkMoveModal';
import { BulkPriceModal } from '../components/menu/BulkPriceModal';
import { ConfirmDialog } from '../components/menu/ConfirmDialog';

// Icons
import {
  Plus,
  Search,
  Layers,
  Move,
  Package,
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  UtensilsCrossed,
  Store,
} from 'lucide-react';

type SortOption =
  | 'category'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'updated_desc'
  | 'available'
  | 'food_type';

type StatusFilterOption = 'all' | 'available' | 'unavailable' | 'needs_review' | 'stale';

export const OwnerMenuPage: React.FC = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Menu Management — Restaurant Dashboard',
    noIndex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  // Restaurant State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Core Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [addons, setAddons] = useState<FoodAddon[]>([]);

  // Page Controls
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all'); // 'all' | 'veg' | 'non_veg' | 'egg' | 'vegan' | 'combos' | category_id
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('category');

  // Selection for Bulk Actions
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modals Visibility & Payloads
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [showReorderModal, setShowReorderModal] = useState(false);
  const [isSubmittingReorder, setIsSubmittingReorder] = useState(false);

  const [showAddonsModal, setShowAddonsModal] = useState(false);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [defaultFoodCategoryId, setDefaultFoodCategoryId] = useState<string | undefined>();
  const [isSubmittingFood, setIsSubmittingFood] = useState(false);

  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [isSubmittingCombo, setIsSubmittingCombo] = useState(false);

  const [priceHistoryVariant, setPriceHistoryVariant] = useState<FoodVariant | null>(null);
  const [priceHistoryFoodName, setPriceHistoryFoodName] = useState<string>('');

  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);

  // Generic Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isConfirmDisabled?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 1. Fetch Restaurants Owned By Logged-in User
  const loadRestaurants = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const items = (data || []) as Restaurant[];
      setRestaurants(items);

      if (items.length > 0) {
        let active = items[0];
        if (restaurantId) {
          const match = items.find((r) => r.id === restaurantId);
          if (match) {
            active = match;
          } else {
            setErrorMsg('Access Denied: Restaurant not found or unauthorized.');
            setCurrentRestaurant(null);
            setIsLoading(false);
            return;
          }
        } else {
          setSearchParams({ restaurantId: active.id }, { replace: true });
        }
        setCurrentRestaurant(active);
      } else {
        setCurrentRestaurant(null);
      }
    } catch (err: unknown) {
      setErrorMsg(sanitizeErrorMessage(err, 'Failed to load restaurant profile.'));
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurantId, setSearchParams]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // 2. Load Categories, Foods, Add-ons, and Combos for Active Restaurant
  const loadMenuData = useCallback(async (rId: string) => {
    setErrorMsg(null);
    try {
      // Fetch in parallel: Categories, Foods, Addons, Combos
      const [catRes, foodRes, addonRes, comboRes] = await Promise.all([
        insforge.database
          .from('categories')
          .select('*')
          .eq('restaurant_id', rId)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),

        insforge.database
          .from('foods')
          .select('*')
          .eq('restaurant_id', rId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),

        insforge.database
          .from('food_addons')
          .select('*')
          .eq('restaurant_id', rId)
          .order('name', { ascending: true }),

        insforge.database
          .from('combos')
          .select('*')
          .eq('restaurant_id', rId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw new Error(catRes.error.message);
      if (foodRes.error) throw new Error(foodRes.error.message);
      if (addonRes.error) throw new Error(addonRes.error.message);
      if (comboRes.error) throw new Error(comboRes.error.message);

      const loadedCats = (catRes.data || []) as Category[];
      const loadedFoods = (foodRes.data || []) as Food[];
      const loadedAddons = (addonRes.data || []) as FoodAddon[];
      const loadedCombos = (comboRes.data || []) as Combo[];

      // Fetch variants and addon mappings for foods if foods exist
      if (loadedFoods.length > 0) {
        const foodIds = loadedFoods.map((f) => f.id);

        const [variantsRes, mappingRes] = await Promise.all([
          insforge.database
            .from('food_variants')
            .select('*')
            .in('food_id', foodIds)
            .order('price', { ascending: true }),

          insforge.database
            .from('food_to_addons')
            .select('*')
            .in('food_id', foodIds),
        ]);

        if (variantsRes.error) throw new Error(variantsRes.error.message);

        // Map variants to foods
        const variantMap: Record<string, FoodVariant[]> = {};
        ((variantsRes.data || []) as FoodVariant[]).forEach((v) => {
          if (!variantMap[v.food_id]) variantMap[v.food_id] = [];
          variantMap[v.food_id].push(v);
        });

        // Map addons to foods
        const addonMap: Record<string, FoodAddon[]> = {};
        const addonIdsMap: Record<string, string[]> = {};
        const addonsLookup = new Map(loadedAddons.map((a) => [a.id, a]));

        ((mappingRes.data || []) as { food_id: string; addon_id: string }[]).forEach((m) => {
          if (!addonMap[m.food_id]) addonMap[m.food_id] = [];
          if (!addonIdsMap[m.food_id]) addonIdsMap[m.food_id] = [];
          const found = addonsLookup.get(m.addon_id);
          if (found) {
            addonMap[m.food_id].push(found);
            addonIdsMap[m.food_id].push(m.addon_id);
          }
        });

        loadedFoods.forEach((f) => {
          f.variants = variantMap[f.id] || [];
          f.addons = addonMap[f.id] || [];
          f.addon_ids = addonIdsMap[f.id] || [];
        });
      }

      // Fetch combo_items for combos
      if (loadedCombos.length > 0) {
        const comboIds = loadedCombos.map((c) => c.id);
        const { data: ciData, error: ciError } = await insforge.database
          .from('combo_items')
          .select('*, food:foods(*)')
          .in('combo_id', comboIds);

        if (!ciError && ciData) {
          const comboItemMap: Record<string, ComboItem[]> = {};
          (ciData as ComboItem[]).forEach((ci) => {
            if (!comboItemMap[ci.combo_id]) comboItemMap[ci.combo_id] = [];
            comboItemMap[ci.combo_id].push(ci);
          });

          loadedCombos.forEach((c) => {
            c.items = comboItemMap[c.id] || [];
          });
        }
      }

      setCategories(loadedCats);
      setFoods(loadedFoods);
      setAddons(loadedAddons);
      setCombos(loadedCombos);
      setSelectedFoodIds([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load menu details.');
    }
  }, []);

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadMenuData(currentRestaurant.id);
    }
  }, [currentRestaurant, loadMenuData]);

  // -------------------------------------------------------------
  // DYNAMIC FILTER COUNTS (Strictly Database Derived)
  // -------------------------------------------------------------
  const counts = useMemo(() => {
    const totalFoods = foods.length;
    const vegCount = foods.filter((f) => f.veg_type === 'veg').length;
    const nonVegCount = foods.filter((f) => f.veg_type === 'non_veg').length;
    const comboCount = combos.length;

    // Status counts
    const availableCount = foods.filter((f) => f.available).length;
    const unavailableCount = foods.filter((f) => !f.available).length;
    const needsReviewCount = foods.filter((f) => {
      const s = getFreshnessStatus(f.updated_at);
      return s === 'review_recommended' || s === 'stale';
    }).length;
    const staleCount = foods.filter((f) => getFreshnessStatus(f.updated_at) === 'stale').length;

    // Per category counts
    const perCategory: Record<string, number> = {};
    categories.forEach((c) => {
      perCategory[c.id] = foods.filter((f) => f.category_id === c.id).length;
    });

    return {
      all: totalFoods + comboCount,
      totalFoods,
      vegCount,
      nonVegCount,
      comboCount,
      availableCount,
      unavailableCount,
      needsReviewCount,
      staleCount,
      perCategory,
    };
  }, [foods, combos, categories]);

  // -------------------------------------------------------------
  // FILTERING & SORTING LOGIC
  // -------------------------------------------------------------
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.category?.name?.toLowerCase().includes(q) ||
          f.variants?.some((v) => v.name.toLowerCase().includes(q))
      );
    }

    // 2. Category / Dietary Filter
    if (activeCategoryFilter !== 'all') {
      if (activeCategoryFilter === 'veg') {
        result = result.filter((f) => f.veg_type === 'veg');
      } else if (activeCategoryFilter === 'non_veg') {
        result = result.filter((f) => f.veg_type === 'non_veg');
      } else if (activeCategoryFilter === 'combos') {
        return []; // In combos mode, no standard foods shown
      } else {
        // Specific category id
        result = result.filter((f) => f.category_id === activeCategoryFilter);
      }
    }

    // 3. Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        result = result.filter((f) => f.available);
      } else if (statusFilter === 'unavailable') {
        result = result.filter((f) => !f.available);
      } else if (statusFilter === 'needs_review') {
        result = result.filter((f) => {
          const s = getFreshnessStatus(f.updated_at);
          return s === 'review_recommended' || s === 'stale';
        });
      } else if (statusFilter === 'stale') {
        result = result.filter((f) => getFreshnessStatus(f.updated_at) === 'stale');
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') {
        const pA = a.variants?.[0]?.price ?? 0;
        const pB = b.variants?.[0]?.price ?? 0;
        return Number(pA) - Number(pB);
      }
      if (sortBy === 'price_desc') {
        const pA = a.variants?.[0]?.price ?? 0;
        const pB = b.variants?.[0]?.price ?? 0;
        return Number(pB) - Number(pA);
      }
      if (sortBy === 'updated_desc') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === 'available') {
        return (b.available ? 1 : 0) - (a.available ? 1 : 0);
      }
      if (sortBy === 'food_type') {
        return a.veg_type.localeCompare(b.veg_type);
      }
      return 0; // 'category' default order preserved
    });

    return result;
  }, [foods, searchQuery, activeCategoryFilter, statusFilter, sortBy]);

  const filteredCombos = useMemo(() => {
    if (activeCategoryFilter !== 'all' && activeCategoryFilter !== 'combos') {
      return [];
    }
    let result = [...combos];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.items?.some((it) => it.food?.name?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') result = result.filter((c) => c.available);
      if (statusFilter === 'unavailable') result = result.filter((c) => !c.available);
    }
    return result;
  }, [combos, searchQuery, activeCategoryFilter, statusFilter]);

  // -------------------------------------------------------------
  // CATEGORY OPERATIONS
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (payload: {
    name: string;
    description: string;
    sort_order: number;
  }) => {
    if (!currentRestaurant) return;
    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        const { error } = await insforge.database
          .from('categories')
          .update({
            name: payload.name,
            description: payload.description || null,
            sort_order: payload.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw new Error(error.message);
        setSuccessMsg(`Category "${payload.name}" updated successfully.`);
      } else {
        const { error } = await insforge.database.from('categories').insert([
          {
            restaurant_id: currentRestaurant.id,
            name: payload.name,
            description: payload.description || null,
            sort_order: payload.sort_order,
          },
        ]);

        if (error) throw new Error(error.message);
        setSuccessMsg(`Category "${payload.name}" created successfully.`);
      }

      setShowCategoryModal(false);
      loadMenuData(currentRestaurant.id);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleRequestDeleteCategory = (cat: Category) => {
    // Check whether items exist inside category (Requirement #17)
    const itemsInCat = foods.filter((f) => f.category_id === cat.id);

    if (itemsInCat.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cannot Delete Category',
        message: `You have ${itemsInCat.length} ${
          itemsInCat.length === 1 ? 'dish' : 'dishes'
        } in this category. Move them to another category before deleting.`,
        confirmLabel: 'Understood',
        isConfirmDisabled: true,
        variant: 'warning',
        onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Category',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await insforge.database.from('categories').delete().eq('id', cat.id);
          if (error) throw new Error(error.message);
          setSuccessMsg(`Category "${cat.name}" deleted.`);
          if (currentRestaurant) loadMenuData(currentRestaurant.id);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete category.');
        } finally {
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  const handleSaveCategoryOrder = async (orderedCategories: Category[]) => {
    setIsSubmittingReorder(true);
    try {
      for (const cat of orderedCategories) {
        await insforge.database
          .from('categories')
          .update({ sort_order: cat.sort_order })
          .eq('id', cat.id);
      }
      setSuccessMsg('Category display order updated.');
      setShowReorderModal(false);
      if (currentRestaurant) loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reorder categories.');
    } finally {
      setIsSubmittingReorder(false);
    }
  };

  // -------------------------------------------------------------
  // FOOD CRUD & ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddFood = (defaultCatId?: string) => {
    setEditingFood(null);
    setDefaultFoodCategoryId(defaultCatId || categories[0]?.id);
    setShowFoodModal(true);
  };

  const handleOpenEditFood = (food: Food) => {
    setEditingFood(food);
    setShowFoodModal(true);
  };

  const handleSaveFood = async (data: FoodFormData) => {
    if (!currentRestaurant) return;
    setIsSubmittingFood(true);
    try {
      let foodId = editingFood?.id;

      if (editingFood) {
        // Update food
        const { error: fErr } = await insforge.database
          .from('foods')
          .update({
            category_id: data.category_id,
            name: data.name,
            description: data.description || null,
            image_url: data.image_url,
            veg_type: data.veg_type,
            prep_time_minutes: data.prep_time_minutes,
            base_price: data.base_price,
            discount_price: data.discount_price,
            available: data.available,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFood.id);

        if (fErr) throw new Error(fErr.message);

        // Update/Insert variants
        for (const v of data.variants) {
          const priceNum = parseFloat(v.price);
          if (v.id) {
            await insforge.database
              .from('food_variants')
              .update({
                name: v.name.trim(),
                price: priceNum,
                available: v.available,
              })
              .eq('id', v.id);
          } else {
            await insforge.database.from('food_variants').insert([
              {
                food_id: editingFood.id,
                name: v.name.trim(),
                price: priceNum,
                available: v.available,
              },
            ]);
          }
        }

        // Sync food_to_addons
        await insforge.database.from('food_to_addons').delete().eq('food_id', editingFood.id);
        if (data.selectedAddonIds.length > 0) {
          const addonRows = data.selectedAddonIds.map((aid) => ({
            food_id: editingFood.id,
            addon_id: aid,
          }));
          await insforge.database.from('food_to_addons').insert(addonRows);
        }

        setSuccessMsg(`Dish "${data.name}" updated successfully.`);
      } else {
        // Insert new food
        const { data: newFood, error: fErr } = await insforge.database
          .from('foods')
          .insert([
            {
              restaurant_id: currentRestaurant.id,
              category_id: data.category_id,
              name: data.name,
              description: data.description || null,
              image_url: data.image_url,
              veg_type: data.veg_type,
              prep_time_minutes: data.prep_time_minutes,
              base_price: data.base_price,
              discount_price: data.discount_price,
              available: data.available,
              status: 'active',
            },
          ])
          .select()
          .single();

        if (fErr) throw new Error(fErr.message);
        foodId = newFood.id;

        // Insert variants
        const variantsToInsert = data.variants.map((v) => ({
          food_id: foodId,
          name: v.name.trim(),
          price: parseFloat(v.price),
          available: v.available,
        }));
        await insforge.database.from('food_variants').insert(variantsToInsert);

        // Insert add-on mappings
        if (data.selectedAddonIds.length > 0) {
          const addonRows = data.selectedAddonIds.map((aid) => ({
            food_id: foodId,
            addon_id: aid,
          }));
          await insforge.database.from('food_to_addons').insert(addonRows);
        }

        setSuccessMsg(`Dish "${data.name}" added to menu.`);
      }

      setShowFoodModal(false);
      loadMenuData(currentRestaurant.id);
    } finally {
      setIsSubmittingFood(false);
    }
  };

  const handleDuplicateFood = async (food: Food) => {
    if (!currentRestaurant) return;
    try {
      const copyName = `${food.name} (Copy)`;
      const { data: newFood, error: fErr } = await insforge.database
        .from('foods')
        .insert([
          {
            restaurant_id: currentRestaurant.id,
            category_id: food.category_id,
            name: copyName,
            description: food.description,
            image_url: food.image_url,
            veg_type: food.veg_type,
            prep_time_minutes: food.prep_time_minutes,
            base_price: food.base_price,
            discount_price: food.discount_price,
            available: food.available,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (fErr) throw new Error(fErr.message);

      // Copy variants
      if (food.variants && food.variants.length > 0) {
        const variantsCopy = food.variants.map((v) => ({
          food_id: newFood.id,
          name: v.name,
          price: v.price,
          available: v.available,
        }));
        await insforge.database.from('food_variants').insert(variantsCopy);
      }

      // Copy add-ons
      if (food.addon_ids && food.addon_ids.length > 0) {
        const addonRows = food.addon_ids.map((aid) => ({
          food_id: newFood.id,
          addon_id: aid,
        }));
        await insforge.database.from('food_to_addons').insert(addonRows);
      }

      setSuccessMsg(`Created duplicate "${copyName}".`);
      loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to duplicate dish.');
    }
  };

  const handleToggleFoodAvailability = (food: Food) => {
    const nextStatus = !food.available;
    setConfirmDialog({
      isOpen: true,
      title: nextStatus ? 'Mark Dish as Available' : 'Mark Dish as Unavailable',
      message: `Set "${food.name}" to ${
        nextStatus ? 'Available for customer orders' : 'Unavailable'
      }?`,
      confirmLabel: nextStatus ? 'Mark Available' : 'Mark Unavailable',
      variant: nextStatus ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          const { error } = await insforge.database
            .from('foods')
            .update({ available: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', food.id);

          if (error) throw new Error(error.message);

          setFoods((prev) =>
            prev.map((f) => (f.id === food.id ? { ...f, available: nextStatus } : f))
          );
          setSuccessMsg(`"${food.name}" marked as ${nextStatus ? 'Available' : 'Unavailable'}.`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to change availability.');
        } finally {
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  const handleConfirmFresh = async (food: Food) => {
    try {
      const now = new Date().toISOString();
      const { error } = await insforge.database
        .from('foods')
        .update({ updated_at: now })
        .eq('id', food.id);

      if (error) throw new Error(error.message);

      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, updated_at: now } : f))
      );
      setSuccessMsg(`"${food.name}" verified. Freshness status updated to today.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update freshness date.');
    }
  };

  const handleDeleteFood = (food: Food) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Dish from Menu',
      message: `Are you sure you want to remove "${food.name}" from your active menu?`,
      confirmLabel: 'Remove Dish',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await insforge.database
            .from('foods')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', food.id);

          if (error) throw new Error(error.message);

          setFoods((prev) => prev.filter((f) => f.id !== food.id));
          setSuccessMsg(`"${food.name}" removed from menu.`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to remove dish.');
        } finally {
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  // -------------------------------------------------------------
  // COMBO CRUD & ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddCombo = () => {
    setEditingCombo(null);
    setShowComboModal(true);
  };

  const handleOpenEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setShowComboModal(true);
  };

  const handleSaveCombo = async (data: ComboFormData) => {
    if (!currentRestaurant) return;
    setIsSubmittingCombo(true);
    try {
      let comboId = editingCombo?.id;

      if (editingCombo) {
        // Update combo
        const { error: cErr } = await insforge.database
          .from('combos')
          .update({
            name: data.name,
            combo_type: data.combo_type,
            veg_type: data.veg_type,
            description: data.description || null,
            image_url: data.image_url,
            combo_price: data.combo_price,
            original_price: data.original_price,
            savings: data.savings,
            available: data.available,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCombo.id);

        if (cErr) throw new Error(cErr.message);

        // Replace combo items
        await insforge.database.from('combo_items').delete().eq('combo_id', editingCombo.id);
        const itemRows = data.items.map((it) => ({
          combo_id: editingCombo.id,
          food_id: it.food_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
        }));
        await insforge.database.from('combo_items').insert(itemRows);

        setSuccessMsg(`Combo "${data.name}" updated successfully.`);
      } else {
        // Insert combo
        const { data: newCombo, error: cErr } = await insforge.database
          .from('combos')
          .insert([
            {
              restaurant_id: currentRestaurant.id,
              name: data.name,
              slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              combo_type: data.combo_type,
              veg_type: data.veg_type,
              description: data.description || null,
              image_url: data.image_url,
              combo_price: data.combo_price,
              original_price: data.original_price,
              savings: data.savings,
              available: data.available,
              status: 'active',
            },
          ])
          .select()
          .single();

        if (cErr) throw new Error(cErr.message);
        comboId = newCombo.id;

        // Insert items
        const itemRows = data.items.map((it) => ({
          combo_id: comboId,
          food_id: it.food_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
        }));
        await insforge.database.from('combo_items').insert(itemRows);

        setSuccessMsg(`Combo "${data.name}" added to menu.`);
      }

      setShowComboModal(false);
      loadMenuData(currentRestaurant.id);
    } finally {
      setIsSubmittingCombo(false);
    }
  };

  const handleDuplicateCombo = async (combo: Combo) => {
    if (!currentRestaurant) return;
    try {
      const copyName = `${combo.name} (Copy)`;
      const { data: newCombo, error: cErr } = await insforge.database
        .from('combos')
        .insert([
          {
            restaurant_id: currentRestaurant.id,
            name: copyName,
            slug: copyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            combo_type: combo.combo_type,
            veg_type: combo.veg_type,
            description: combo.description,
            image_url: combo.image_url,
            combo_price: combo.combo_price,
            original_price: combo.original_price,
            savings: combo.savings,
            available: combo.available,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (cErr) throw new Error(cErr.message);

      if (combo.items && combo.items.length > 0) {
        const itemRows = combo.items.map((it) => ({
          combo_id: newCombo.id,
          food_id: it.food_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
        }));
        await insforge.database.from('combo_items').insert(itemRows);
      }

      setSuccessMsg(`Created duplicate combo "${copyName}".`);
      loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to duplicate combo.');
    }
  };

  const handleToggleComboAvailability = async (combo: Combo) => {
    try {
      const nextStatus = !combo.available;
      const { error } = await insforge.database
        .from('combos')
        .update({ available: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', combo.id);

      if (error) throw new Error(error.message);

      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, available: nextStatus } : c))
      );
      setSuccessMsg(`Combo "${combo.name}" marked as ${nextStatus ? 'Available' : 'Unavailable'}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change combo availability.');
    }
  };

  const handleDeleteCombo = (combo: Combo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Combo Package',
      message: `Are you sure you want to remove "${combo.name}" from your active menu?`,
      confirmLabel: 'Remove Combo',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await insforge.database
            .from('combos')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', combo.id);

          if (error) throw new Error(error.message);

          setCombos((prev) => prev.filter((c) => c.id !== combo.id));
          setSuccessMsg(`Combo "${combo.name}" removed.`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete combo.');
        } finally {
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  // -------------------------------------------------------------
  // MULTI-SELECT & BULK ACTIONS
  // -------------------------------------------------------------
  const toggleSelectFood = (foodId: string) => {
    setSelectedFoodIds((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  };

  const handleSelectAllInView = () => {
    const allFilteredIds = filteredFoods.map((f) => f.id);
    if (selectedFoodIds.length === allFilteredIds.length) {
      setSelectedFoodIds([]);
    } else {
      setSelectedFoodIds(allFilteredIds);
    }
  };

  const handleBulkMarkAvailable = async () => {
    if (selectedFoodIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await insforge.database
        .from('foods')
        .update({ available: true, updated_at: now })
        .in('id', selectedFoodIds);

      if (error) throw new Error(error.message);

      setFoods((prev) =>
        prev.map((f) => (selectedFoodIds.includes(f.id) ? { ...f, available: true, updated_at: now } : f))
      );
      setSuccessMsg(`Marked ${selectedFoodIds.length} dishes as Available.`);
      setSelectedFoodIds([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk update failed.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkMarkUnavailable = async () => {
    if (selectedFoodIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await insforge.database
        .from('foods')
        .update({ available: false, updated_at: now })
        .in('id', selectedFoodIds);

      if (error) throw new Error(error.message);

      setFoods((prev) =>
        prev.map((f) => (selectedFoodIds.includes(f.id) ? { ...f, available: false, updated_at: now } : f))
      );
      setSuccessMsg(`Marked ${selectedFoodIds.length} dishes as Unavailable.`);
      setSelectedFoodIds([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk update failed.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkMoveCategory = async (targetCategoryId: string) => {
    setIsBulkProcessing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await insforge.database
        .from('foods')
        .update({ category_id: targetCategoryId, updated_at: now })
        .in('id', selectedFoodIds);

      if (error) throw new Error(error.message);

      setFoods((prev) =>
        prev.map((f) =>
          selectedFoodIds.includes(f.id) ? { ...f, category_id: targetCategoryId, updated_at: now } : f
        )
      );
      const targetCat = categories.find((c) => c.id === targetCategoryId);
      setSuccessMsg(`Moved ${selectedFoodIds.length} dishes to "${targetCat?.name}".`);
      setShowBulkMoveModal(false);
      setSelectedFoodIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkPriceUpdate = async (
    adjustmentType: 'fixed_add' | 'fixed_sub' | 'percent_add' | 'percent_sub',
    amount: number
  ) => {
    setIsBulkProcessing(true);
    try {
      // Fetch variants for all selected dishes
      const { data: vData, error: vErr } = await insforge.database
        .from('food_variants')
        .select('*')
        .in('food_id', selectedFoodIds);

      if (vErr) throw new Error(vErr.message);

      const variants = (vData || []) as FoodVariant[];

      for (const v of variants) {
        let currentP = Number(v.price);
        let newP = currentP;

        if (adjustmentType === 'fixed_add') newP = currentP + amount;
        else if (adjustmentType === 'fixed_sub') newP = Math.max(0, currentP - amount);
        else if (adjustmentType === 'percent_add') newP = Math.round(currentP * (1 + amount / 100));
        else if (adjustmentType === 'percent_sub') newP = Math.max(0, Math.round(currentP * (1 - amount / 100)));

        if (newP !== currentP) {
          // Updating price automatically triggers track_variant_price_change in DB!
          await insforge.database
            .from('food_variants')
            .update({ price: newP, updated_at: new Date().toISOString() })
            .eq('id', v.id);
        }
      }

      setSuccessMsg(`Updated prices for ${variants.length} variant portions.`);
      setShowBulkPriceModal(false);
      setSelectedFoodIds([]);
      if (currentRestaurant) loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update prices.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Selected Dishes',
      message: `Are you sure you want to remove all ${selectedFoodIds.length} selected dishes from the menu?`,
      confirmLabel: 'Remove Selected',
      variant: 'danger',
      onConfirm: async () => {
        setIsBulkProcessing(true);
        try {
          const now = new Date().toISOString();
          const { error } = await insforge.database
            .from('foods')
            .update({ status: 'archived', updated_at: now })
            .in('id', selectedFoodIds);

          if (error) throw new Error(error.message);

          setFoods((prev) => prev.filter((f) => !selectedFoodIds.includes(f.id)));
          setSuccessMsg(`Removed ${selectedFoodIds.length} dishes from menu.`);
          setSelectedFoodIds([]);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to remove dishes.');
        } finally {
          setIsBulkProcessing(false);
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-orange-100 selection:text-orange-950">
      <OwnerNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ============================================================== */}
        {/* 1. MENU MANAGEMENT HEADER */}
        {/* ============================================================== */}
        <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Restaurant SaaS Dashboard
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Sync
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Menu Management
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Organize categories, dishes, combos, variants, add-ons and pricing for{' '}
                <span className="font-semibold text-slate-900">
                  {currentRestaurant?.name || 'Your Restaurant'}
                </span>
              </p>

              {/* Multi-Restaurant Switcher */}
              {restaurants.length > 1 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    Switch Shop:
                  </span>
                  <select
                    value={currentRestaurant?.id || ''}
                    onChange={(e) => {
                      const match = restaurants.find((r) => r.id === e.target.value);
                      if (match) {
                        setCurrentRestaurant(match);
                        setSearchParams({ restaurantId: match.id }, { replace: true });
                      }
                    }}
                    className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:border-slate-800"
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

            {/* Top Right Action Buttons (Section 1) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FolderPlus className="w-4 h-4 text-slate-500" />
                <span>+ Add Category</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddFood()}
                disabled={categories.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-300 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Food</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddCombo}
                disabled={foods.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 disabled:bg-slate-300 transition-colors shadow-sm"
              >
                <Package className="w-4 h-4" />
                <span>+ Add Combo</span>
              </button>
            </div>
          </div>

          {/* Quick Toolbar for Add-ons and Reorder */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddonsModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Add-ons ({addons.length})</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setShowReorderModal(true)}
                disabled={categories.length <= 1}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline disabled:opacity-40 disabled:hover:no-underline"
              >
                <Move className="w-3.5 h-3.5 text-slate-500" />
                <span>Reorder Categories</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Total Menu Items:{' '}
              <span className="font-bold text-slate-700">{counts.totalFoods} Dishes</span> +{' '}
              <span className="font-bold text-slate-700">{counts.comboCount} Combos</span>
            </div>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. SEARCH & SORT BAR */}
        {/* ============================================================== */}
        <div className="bg-white border border-slate-200 rounded-md p-3 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Instant Search Bar (Section 13) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food, category or combo..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-800 bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Controls (Section 14) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="category">Category Order</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="updated_desc">Recently Updated</option>
              <option value="available">Availability</option>
              <option value="food_type">Food Type</option>
            </select>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. MENU FILTERS WITH DYNAMIC DATABASE COUNTS (Section 2) */}
        {/* ============================================================== */}
        <div className="space-y-3 mb-6">
          {/* Category & Dietary Filters Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-colors border ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter('veg')}
              className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-colors border ${
                activeCategoryFilter === 'veg'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50/50'
              }`}
            >
              Veg ({counts.vegCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter('non_veg')}
              className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-colors border ${
                activeCategoryFilter === 'non_veg'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-sm'
                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50/50'
              }`}
            >
              Non-Veg ({counts.nonVegCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter('combos')}
              className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-colors border ${
                activeCategoryFilter === 'combos'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Combos ({counts.comboCount})
            </button>

            {/* Individual categories chips */}
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition-colors border ${
                  activeCategoryFilter === c.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.name} ({counts.perCategory[c.id] || 0})
              </button>
            ))}
          </div>

          {/* Status Filters Bar (Section 2) */}
          <div className="bg-white border border-slate-200 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 tracking-wider">
                Status:
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Items ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'available'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Available ({counts.availableCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unavailable')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'unavailable'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                Unavailable ({counts.unavailableCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('needs_review')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'needs_review'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Needs Review ({counts.needsReviewCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('stale')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'stale'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Stale ({counts.staleCount})
              </button>
            </div>

            {(statusFilter !== 'all' || activeCategoryFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setActiveCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-slate-500 hover:text-slate-900 underline text-[11px] font-medium"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Multi-Select Select All Toolbar */}
        {filteredFoods.length > 0 && (
          <div className="mb-4 flex items-center justify-between px-1 text-xs text-slate-500">
            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={
                  selectedFoodIds.length > 0 &&
                  filteredFoods.every((f) => selectedFoodIds.includes(f.id))
                }
                onChange={handleSelectAllInView}
                className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4"
              />
              <span>
                {selectedFoodIds.length > 0
                  ? `Selected ${selectedFoodIds.length} of ${filteredFoods.length} dishes`
                  : `Select all dishes on screen (${filteredFoods.length})`}
              </span>
            </label>

            {selectedFoodIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFoodIds([])}
                className="text-slate-500 hover:text-slate-900 underline text-[11px]"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. MAIN MENU CONTENT / CATEGORIES / COMBOS */}
        {/* ============================================================== */}
        {isLoading ? (
          <div className="py-24 text-center text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-md">
            Loading menu records from database...
          </div>
        ) : !currentRestaurant ? (
          /* Empty State: No Restaurant */
          <div className="border border-dashed border-slate-300 rounded-md p-14 text-center bg-white">
            <UtensilsCrossed className="w-10 h-10 text-slate-400 mx-auto mb-3 stroke-1" />
            <h2 className="text-base font-bold text-slate-800 mb-1">No restaurant found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please register your restaurant before managing menu items.
            </p>
          </div>
        ) : categories.length === 0 && combos.length === 0 ? (
          /* Empty State: No Menu (Section 21) */
          <div className="border border-dashed border-slate-300 rounded-md p-14 text-center bg-white space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">No menu items yet</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Start building your menu by adding your first category or dish.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
              >
                + Add Category
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddFood()}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-sm"
              >
                + Add Food
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ------------------------------------------------------------- */}
            {/* COMBOS SHOWCASE SECTION (Sections 6, 7 & 24) */}
            {/* ------------------------------------------------------------- */}
            {(activeCategoryFilter === 'all' || activeCategoryFilter === 'combos') && (
              <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <span>Combos & Bundled Deals</span>
                        <span className="text-xs font-bold text-slate-500">
                          ({filteredCombos.length})
                        </span>
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Multi-dish packages with automatic savings calculation.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddCombo}
                    disabled={foods.length === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-700 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Combo</span>
                  </button>
                </div>

                {filteredCombos.length === 0 ? (
                  <div className="py-8 px-4 border border-dashed border-slate-200 rounded text-center">
                    <p className="text-xs text-slate-500 mb-2">No combo packages created yet.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddCombo}
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Create your first bundled combo deal (e.g. Biryani + Chap)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCombos.map((combo) => (
                      <ComboCard
                        key={combo.id}
                        combo={combo}
                        onEdit={handleOpenEditCombo}
                        onDuplicate={handleDuplicateCombo}
                        onDelete={handleDeleteCombo}
                        onToggleAvailability={handleToggleComboAvailability}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORIES & FOOD ITEMS SECTIONS (Sections 3, 9, 21) */}
            {/* ------------------------------------------------------------- */}
            {activeCategoryFilter !== 'combos' && (
              <div className="space-y-8">
                {categories.map((cat) => {
                  const catFoods = filteredFoods.filter((f) => f.category_id === cat.id);

                  // If user selected a specific filter and category is empty, skip rendering it
                  if (activeCategoryFilter !== 'all' && activeCategoryFilter !== cat.id) {
                    return null;
                  }
                  if (statusFilter !== 'all' && catFoods.length === 0) {
                    return null;
                  }
                  if (searchQuery.trim() && catFoods.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={cat.id}
                      className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4"
                    >
                      {/* Category Header (Section 3) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                              {cat.name}
                            </h2>
                            <span className="text-xs font-semibold text-slate-400">
                              ({catFoods.length} {catFoods.length === 1 ? 'dish' : 'dishes'})
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                          )}
                        </div>

                        {/* Category Actions: Add Dish, Rename, Delete (Section 3 & 17) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenAddFood(cat.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Dish</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                          >
                            Rename
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestDeleteCategory(cat)}
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Food Grid / Empty Category State (Section 21) */}
                      {catFoods.length === 0 ? (
                        <div className="py-8 px-4 border border-dashed border-slate-200 rounded text-center">
                          <p className="text-xs text-slate-500 mb-2">
                            No dishes in this category yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenAddFood(cat.id)}
                            className="text-xs font-bold text-slate-900 hover:underline"
                          >
                            + Add Dish to {cat.name}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {catFoods.map((food) => (
                            <FoodCard
                              key={food.id}
                              food={food}
                              isSelected={selectedFoodIds.includes(food.id)}
                              onSelect={toggleSelectFood}
                              onEdit={handleOpenEditFood}
                              onDuplicate={handleDuplicateFood}
                              onDelete={handleDeleteFood}
                              onToggleAvailability={handleToggleFoodAvailability}
                              onConfirmFresh={handleConfirmFresh}
                              onViewPriceHistory={(variant, fname) => {
                                setPriceHistoryVariant(variant);
                                setPriceHistoryFoodName(fname);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. BULK ACTIONS FLOATING TOOLBAR (Section 11) */}
      {/* ============================================================== */}
      <BulkActionsBar
        selectedCount={selectedFoodIds.length}
        onMarkAvailable={handleBulkMarkAvailable}
        onMarkUnavailable={handleBulkMarkUnavailable}
        onMoveCategory={() => setShowBulkMoveModal(true)}
        onUpdatePrice={() => setShowBulkPriceModal(true)}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedFoodIds([])}
        isProcessing={isBulkProcessing}
      />

      {/* ============================================================== */}
      {/* 6. MODALS & DIALOGS */}
      {/* ============================================================== */}
      {/* Category Add/Edit Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        category={editingCategory}
        currentCount={categories.length}
        isSubmitting={isSubmittingCategory}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleSaveCategory}
      />

      {/* Category Reordering Modal */}
      <CategoryReorderModal
        isOpen={showReorderModal}
        categories={categories}
        isSubmitting={isSubmittingReorder}
        onClose={() => setShowReorderModal(false)}
        onSaveOrder={handleSaveCategoryOrder}
      />

      {/* Food Add/Edit Modal */}
      <FoodEditorModal
        isOpen={showFoodModal}
        food={editingFood}
        categories={categories}
        addons={addons}
        defaultCategoryId={defaultFoodCategoryId}
        isSubmitting={isSubmittingFood}
        onClose={() => setShowFoodModal(false)}
        onSave={handleSaveFood}
        onOpenAddonManager={() => {
          setShowFoodModal(false);
          setShowAddonsModal(true);
        }}
      />

      {/* Combo Add/Edit Modal */}
      <ComboEditorModal
        isOpen={showComboModal}
        combo={editingCombo}
        availableFoods={foods}
        isSubmitting={isSubmittingCombo}
        onClose={() => setShowComboModal(false)}
        onSave={handleSaveCombo}
      />

      {/* Add-ons Library Manager Modal */}
      {currentRestaurant && (
        <AddonsManagerModal
          isOpen={showAddonsModal}
          restaurantId={currentRestaurant.id}
          addons={addons}
          onClose={() => setShowAddonsModal(false)}
          onRefresh={() => loadMenuData(currentRestaurant.id)}
        />
      )}

      {/* Price History Timeline Modal */}
      <PriceHistoryModal
        variant={priceHistoryVariant}
        foodName={priceHistoryFoodName}
        onClose={() => setPriceHistoryVariant(null)}
      />

      {/* Bulk Move Category Modal */}
      <BulkMoveModal
        isOpen={showBulkMoveModal}
        selectedCount={selectedFoodIds.length}
        categories={categories}
        isSubmitting={isBulkProcessing}
        onClose={() => setShowBulkMoveModal(false)}
        onConfirmMove={handleBulkMoveCategory}
      />

      {/* Bulk Update Price Modal */}
      <BulkPriceModal
        isOpen={showBulkPriceModal}
        selectedCount={selectedFoodIds.length}
        isSubmitting={isBulkProcessing}
        onClose={() => setShowBulkPriceModal(false)}
        onConfirmPriceUpdate={handleBulkPriceUpdate}
      />

      {/* Generic Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        isConfirmDisabled={confirmDialog.isConfirmDisabled}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};
