import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OwnerNav } from '../components/OwnerNav';
import {
  insforge,
  Restaurant,
  Category,
  Food,
  FoodVariant,
  PriceHistory,
  uploadMediaImage,
} from '../lib/insforge';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface VariantInput {
  id?: string;
  name: string;
  price: string;
  available: boolean;
}

export const OwnerMenuPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCategoryId, setFoodCategoryId] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodVegType, setFoodVegType] = useState<'veg' | 'non_veg'>('veg');
  const [foodImageUrl, setFoodImageUrl] = useState<string | null>(null);
  const [foodAvailable, setFoodAvailable] = useState(true);
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: 'Regular', price: '', available: true },
  ]);
  const [isUploadingFoodImg, setIsUploadingFoodImg] = useState(false);
  const [isSubmittingFood, setIsSubmittingFood] = useState(false);

  // Price history modal
  const [priceHistoryVariant, setPriceHistoryVariant] = useState<FoodVariant | null>(null);
  const [priceHistoryRecords, setPriceHistoryRecords] = useState<PriceHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. Load Owner Restaurants
  const loadRestaurants = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const items = (data || []) as Restaurant[];
      setRestaurants(items);

      if (items.length > 0) {
        let active = items[0];
        if (restaurantId) {
          const match = items.find((r) => r.id === restaurantId);
          if (match) active = match;
        } else {
          setSearchParams({ restaurantId: active.id }, { replace: true });
        }
        setCurrentRestaurant(active);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load restaurant.');
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurantId, setSearchParams]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // 2. Load Categories & Foods for Active Restaurant
  const loadMenuData = useCallback(async (rId: string) => {
    setErrorMsg(null);
    try {
      // Categories
      const { data: catData, error: catError } = await insforge.database
        .from('categories')
        .select('*')
        .eq('restaurant_id', rId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (catError) throw new Error(catError.message);
      setCategories((catData || []) as Category[]);

      // Foods with active status
      const { data: foodData, error: foodError } = await insforge.database
        .from('foods')
        .select('*')
        .eq('restaurant_id', rId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (foodError) throw new Error(foodError.message);

      const foodsList = (foodData || []) as Food[];

      // Fetch variants for each food
      if (foodsList.length > 0) {
        const foodIds = foodsList.map((f) => f.id);
        const { data: varData, error: varError } = await insforge.database
          .from('food_variants')
          .select('*')
          .in('food_id', foodIds)
          .order('price', { ascending: true });

        if (varError) throw new Error(varError.message);

        const variantMap: Record<string, FoodVariant[]> = {};
        ((varData || []) as FoodVariant[]).forEach((v) => {
          if (!variantMap[v.food_id]) variantMap[v.food_id] = [];
          variantMap[v.food_id].push(v);
        });

        foodsList.forEach((f) => {
          f.variants = variantMap[f.id] || [];
        });
      }

      setFoods(foodsList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load menu items.');
    }
  }, []);

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadMenuData(currentRestaurant.id);
    }
  }, [currentRestaurant, loadMenuData]);

  // CATEGORY ACTIONS
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryNameInput(cat.name);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    const trimmed = categoryNameInput.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 100) {
      setErrorMsg('Category name must be between 2 and 100 characters.');
      return;
    }

    setIsSubmittingCategory(true);
    setErrorMsg(null);
    try {
      if (editingCategory) {
        const { error } = await insforge.database
          .from('categories')
          .update({ name: trimmed, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id);
        if (error) throw new Error(error.message);
        setSuccessMsg(`Category "${trimmed}" updated.`);
      } else {
        const { error } = await insforge.database.from('categories').insert([
          {
            restaurant_id: currentRestaurant.id,
            name: trimmed,
            sort_order: categories.length,
          },
        ]);
        if (error) throw new Error(error.message);
        setSuccessMsg(`Category "${trimmed}" created.`);
      }
      setShowCategoryModal(false);
      loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category.');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const { error } = await insforge.database
        .from('categories')
        .delete()
        .eq('id', cat.id);
      if (error) throw new Error(error.message);
      setSuccessMsg(`Category "${cat.name}" deleted.`);
      if (currentRestaurant) loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('violates foreign key constraint')
          ? 'Cannot delete category while dishes belong to it. Please reassign or delete dishes first.'
          : err.message || 'Failed to delete category.'
      );
    }
  };

  // FOOD ITEM ACTIONS
  const handleOpenAddFood = (defaultCatId?: string) => {
    setEditingFood(null);
    setFoodName('');
    setFoodCategoryId(defaultCatId || (categories[0]?.id ?? ''));
    setFoodDescription('');
    setFoodVegType('veg');
    setFoodImageUrl(null);
    setFoodAvailable(true);
    setVariants([{ name: 'Regular', price: '', available: true }]);
    setShowFoodModal(true);
  };

  const handleOpenEditFood = (food: Food) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodCategoryId(food.category_id);
    setFoodDescription(food.description || '');
    setFoodVegType(food.veg_type);
    setFoodImageUrl(food.image_url);
    setFoodAvailable(food.available);
    if (food.variants && food.variants.length > 0) {
      setVariants(
        food.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price.toString(),
          available: v.available,
        }))
      );
    } else {
      setVariants([{ name: 'Regular', price: '', available: true }]);
    }
    setShowFoodModal(true);
  };

  const handleFoodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFoodImg(true);
    setErrorMsg(null);
    try {
      const result = await uploadMediaImage(file);
      setFoodImageUrl(result.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload food image.');
    } finally {
      setIsUploadingFoodImg(false);
    }
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { name: '', price: '', available: true }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    setErrorMsg(null);

    // Validation
    const cleanName = foodName.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 150) {
      setErrorMsg('Food name must be between 2 and 150 characters.');
      return;
    }

    if (!foodCategoryId) {
      setErrorMsg('Please select a category for this dish.');
      return;
    }

    // Validate variants
    if (variants.length === 0) {
      setErrorMsg('At least one variant with a price is required.');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.name.trim()) {
        setErrorMsg(`Variant #${i + 1} name is required.`);
        return;
      }
      const priceNum = parseFloat(v.price);
      if (isNaN(priceNum) || priceNum < 0) {
        setErrorMsg(`Variant "${v.name}" must have a valid positive price.`);
        return;
      }
    }

    setIsSubmittingFood(true);
    try {
      let foodId = editingFood?.id;

      if (editingFood) {
        // Update food
        const { error: fErr } = await insforge.database
          .from('foods')
          .update({
            category_id: foodCategoryId,
            name: cleanName,
            description: foodDescription.trim() || null,
            image_url: foodImageUrl,
            veg_type: foodVegType,
            available: foodAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFood.id);

        if (fErr) throw new Error(fErr.message);

        // Process variants
        for (const v of variants) {
          const priceNum = parseFloat(v.price);
          if (v.id) {
            // Update existing variant (triggers track_variant_price_change automatically!)
            const { error: vErr } = await insforge.database
              .from('food_variants')
              .update({
                name: v.name.trim(),
                price: priceNum,
                available: v.available,
              })
              .eq('id', v.id);
            if (vErr) throw new Error(vErr.message);
          } else {
            // Insert new variant
            const { error: vErr } = await insforge.database
              .from('food_variants')
              .insert([
                {
                  food_id: editingFood.id,
                  name: v.name.trim(),
                  price: priceNum,
                  available: v.available,
                },
              ]);
            if (vErr) throw new Error(vErr.message);
          }
        }
        setSuccessMsg(`Dish "${cleanName}" updated successfully.`);
      } else {
        // Insert food
        const { data: newFood, error: fErr } = await insforge.database
          .from('foods')
          .insert([
            {
              restaurant_id: currentRestaurant.id,
              category_id: foodCategoryId,
              name: cleanName,
              description: foodDescription.trim() || null,
              image_url: foodImageUrl,
              veg_type: foodVegType,
              available: foodAvailable,
              status: 'active',
            },
          ])
          .select()
          .single();

        if (fErr) throw new Error(fErr.message);
        foodId = newFood.id;

        // Insert variants
        const variantsToInsert = variants.map((v) => ({
          food_id: foodId,
          name: v.name.trim(),
          price: parseFloat(v.price),
          available: v.available,
        }));

        const { error: vErr } = await insforge.database
          .from('food_variants')
          .insert(variantsToInsert);

        if (vErr) throw new Error(vErr.message);
        setSuccessMsg(`Dish "${cleanName}" added to menu.`);
      }

      setShowFoodModal(false);
      loadMenuData(currentRestaurant.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save food item.');
    } finally {
      setIsSubmittingFood(false);
    }
  };

  const handleToggleAvailability = async (food: Food) => {
    try {
      const nextStatus = !food.available;
      const { error } = await insforge.database
        .from('foods')
        .update({ available: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', food.id);

      if (error) throw new Error(error.message);

      setFoods((prev) =>
        prev.map((f) => (f.id === food.id ? { ...f, available: nextStatus } : f))
      );
      setSuccessMsg(
        `"${food.name}" is now marked as ${nextStatus ? 'Available' : 'Unavailable'}.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update availability.');
    }
  };

  const handleDeleteFood = async (food: Food) => {
    if (!confirm(`Are you sure you want to remove "${food.name}" from the menu?`)) return;
    try {
      // Soft-delete to preserve historical orders/price tracking
      const { error } = await insforge.database
        .from('foods')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', food.id);

      if (error) throw new Error(error.message);

      setFoods((prev) => prev.filter((f) => f.id !== food.id));
      setSuccessMsg(`"${food.name}" removed from menu.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete dish.');
    }
  };

  // View price history
  const handleViewPriceHistory = async (variant: FoodVariant) => {
    setPriceHistoryVariant(variant);
    setIsLoadingHistory(true);
    setPriceHistoryRecords([]);
    try {
      const { data, error } = await insforge.database
        .from('price_history')
        .select('*')
        .eq('food_variant_id', variant.id)
        .order('changed_at', { ascending: false });

      if (error) throw new Error(error.message);
      setPriceHistoryRecords((data || []) as PriceHistory[]);
    } catch (err: any) {
      console.error('Failed to load price history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div>
      <OwnerNav />
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Menu Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize categories, dishes, variants, and pricing for{' '}
              <span className="font-semibold text-slate-700">{currentRestaurant?.name}</span>
            </p>
            {restaurants.length > 1 && (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor="restaurant-select" className="text-xs text-slate-500">
                  Switch Restaurant:
                </label>
                <select
                  id="restaurant-select"
                  value={currentRestaurant?.id || ''}
                  onChange={(e) => {
                    const match = restaurants.find((r) => r.id === e.target.value);
                    if (match) {
                      setCurrentRestaurant(match);
                      setSearchParams({ restaurantId: match.id }, { replace: true });
                    }
                  }}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
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

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenAddCategory}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              + Add Category
            </button>
            <button
              onClick={() => handleOpenAddFood()}
              disabled={categories.length === 0}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-300 transition-colors shadow-sm"
            >
              + Add Food
            </button>
          </div>
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
          <div className="py-20 text-center text-sm text-slate-500">
            Loading menu items...
          </div>
        ) : !currentRestaurant ? (
          <div className="border border-dashed border-slate-300 rounded p-12 text-center bg-white">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              No restaurant found
            </h2>
            <p className="text-xs text-slate-500">
              Please register your restaurant before managing menu items.
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded p-12 text-center bg-white space-y-3">
            <h2 className="text-base font-semibold text-slate-800">No categories yet</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Dishes must be organized under categories (for example: Starters, Biryani, Main Course, Drinks).
            </p>
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-sm"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const categoryFoods = foods.filter((f) => f.category_id === cat.id);

              return (
                <div key={cat.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {cat.name}
                      </h2>
                      <span className="text-xs text-slate-400">
                        ({categoryFoods.length} {categoryFoods.length === 1 ? 'dish' : 'dishes'})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenAddFood(cat.id)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                      >
                        + Add Dish
                      </button>
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Food items list */}
                  {categoryFoods.length === 0 ? (
                    <div className="py-6 px-4 bg-white border border-slate-200 rounded text-center">
                      <p className="text-xs text-slate-500 mb-2">
                        No dishes in {cat.name} yet.
                      </p>
                      <button
                        onClick={() => handleOpenAddFood(cat.id)}
                        className="text-xs text-slate-900 font-semibold hover:underline"
                      >
                        Add a dish to {cat.name}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryFoods.map((food) => (
                        <div
                          key={food.id}
                          className="border border-slate-200 bg-white rounded p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                        >
                          <div className="flex items-start space-x-3">
                            {/* Food Image / Neutral Placeholder */}
                            <div className="w-16 h-16 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {food.image_url ? (
                                <img
                                  src={food.image_url}
                                  alt={food.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium text-center px-1">
                                  No Image
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {food.name}
                                </h3>
                                {/* Veg / Non-Veg Accessible Text Badge */}
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                    food.veg_type === 'veg'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {food.veg_type === 'veg' ? 'Veg' : 'Non-Veg'}
                                </span>
                              </div>

                              {food.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                  {food.description}
                                </p>
                              )}

                              {/* Variants & Prices */}
                              <div className="mt-2.5 space-y-1">
                                {food.variants && food.variants.length > 0 ? (
                                  food.variants.map((v) => (
                                    <div
                                      key={v.id}
                                      className="flex items-center justify-between text-xs py-0.5"
                                    >
                                      <span className="text-slate-600 font-medium">
                                        {v.name}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-slate-900">
                                          {formatCurrency(v.price)}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleViewPriceHistory(v)}
                                          title="View price history"
                                          className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                                        >
                                          History
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    No variants defined
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                                food.available
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {food.available ? 'Available' : 'Unavailable'}
                            </span>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleAvailability(food)}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                              >
                                {food.available ? 'Mark Unavailable' : 'Mark Available'}
                              </button>
                              <button
                                onClick={() => handleOpenEditFood(food)}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFood(food)}
                                className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: Category Add / Edit */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-slate-200 p-6 max-w-sm w-full shadow-lg">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {editingCategory ? 'Rename Category' : 'New Category'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Categories help customers easily browse your dishes.
              </p>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="e.g. Biryani / Starters / Desserts"
                    required
                    autoFocus
                    maxLength={100}
                    disabled={isSubmittingCategory}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    disabled={isSubmittingCategory}
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400"
                  >
                    {isSubmittingCategory ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Food Add / Edit */}
        {showFoodModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded border border-slate-200 p-6 max-w-lg w-full shadow-lg my-8">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {editingFood ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Set item description, classification, image, and variant pricing.
              </p>

              <form onSubmit={handleSaveFood} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Chicken Dum Biryani"
                    required
                    maxLength={150}
                    disabled={isSubmittingFood}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={foodCategoryId}
                      onChange={(e) => setFoodCategoryId(e.target.value)}
                      required
                      disabled={isSubmittingFood}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-600"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Dietary Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setFoodVegType('veg')}
                        className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                          foodVegType === 'veg'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoodVegType('non_veg')}
                        className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                          foodVegType === 'non_veg'
                            ? 'bg-rose-50 text-rose-800 border-rose-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Non-Veg
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    placeholder="Ingredients, preparation details, flavor profile..."
                    rows={2}
                    maxLength={2000}
                    disabled={isSubmittingFood}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Food Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Food Image
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {foodImageUrl ? (
                        <img
                          src={foodImageUrl}
                          alt="Food Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center px-1">
                          No Image
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="inline-block cursor-pointer px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {isUploadingFoodImg ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFoodImageUpload}
                          disabled={isUploadingFoodImg || isSubmittingFood}
                          className="hidden"
                        />
                      </label>
                      {foodImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFoodImageUrl(null)}
                          className="text-[11px] text-red-600 hover:underline block"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Food Availability Toggle */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="foodAvailableCheck"
                    checked={foodAvailable}
                    onChange={(e) => setFoodAvailable(e.target.checked)}
                    disabled={isSubmittingFood}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <label
                    htmlFor="foodAvailableCheck"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Mark as available for ordering
                  </label>
                </div>

                {/* Variants & Pricing Section */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Variants & Pricing *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="text-xs text-slate-900 font-semibold hover:underline"
                    >
                      + Add Variant
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Configure portions (e.g. Regular, Half, Full) and their prices.
                  </p>

                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          placeholder="e.g. Full / Half"
                          required
                          disabled={isSubmittingFood}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-600"
                        />
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-medium">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].price = e.target.value;
                              setVariants(updated);
                            }}
                            placeholder="0"
                            required
                            disabled={isSubmittingFood}
                            className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-600"
                          />
                        </div>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            className="text-slate-400 hover:text-red-600 text-xs px-1.5 py-1"
                            title="Remove variant"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFoodModal(false)}
                    disabled={isSubmittingFood}
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFood}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 shadow-sm"
                  >
                    {isSubmittingFood ? 'Saving...' : 'Save Food'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Price History Viewer */}
        {priceHistoryVariant && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-slate-200 p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Price History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Variant: <span className="font-semibold text-slate-700">{priceHistoryVariant.name}</span>
                    {' '}(Current: {formatCurrency(priceHistoryVariant.price)})
                  </p>
                </div>
                <button
                  onClick={() => setPriceHistoryVariant(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading history records...
                </div>
              ) : priceHistoryRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No previous price modifications recorded for this variant.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {priceHistoryRecords.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="line-through text-slate-400 font-medium">
                            {formatCurrency(item.old_price)}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(item.new_price)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatDateTime(item.changed_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => setPriceHistoryVariant(null)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
