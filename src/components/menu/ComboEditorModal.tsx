import React, { useState, useEffect, useMemo } from 'react';
import { Combo, ComboType, Food, FoodVegType, uploadMediaImage } from '../../lib/insforge';
import { DietaryBadge } from './DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { X, Plus, Trash2, Search, UploadCloud, Sparkles, Package } from 'lucide-react';

export interface SelectedComboItem {
  food_id: string;
  food_name: string;
  variant_id?: string | null;
  variant_name?: string;
  unit_price: number;
  quantity: number;
}

export interface ComboFormData {
  name: string;
  combo_type: ComboType;
  veg_type: FoodVegType;
  description: string;
  image_url: string | null;
  combo_price: number;
  original_price: number;
  savings: number;
  available: boolean;
  items: Array<{
    food_id: string;
    variant_id?: string | null;
    quantity: number;
  }>;
}

interface ComboEditorModalProps {
  isOpen: boolean;
  combo: Combo | null;
  availableFoods: Food[];
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: ComboFormData) => Promise<void>;
}

const COMBO_TYPE_LABELS: Record<ComboType, string> = {
  single: 'Single Combo',
  meal: 'Meal Combo',
  family: 'Family Combo',
  couple: 'Couple Combo',
  party: 'Party Combo',
  breakfast: 'Breakfast Combo',
  lunch: 'Lunch Combo',
  dinner: 'Dinner Combo',
};

export const ComboEditorModal: React.FC<ComboEditorModalProps> = ({
  isOpen,
  combo,
  availableFoods,
  isSubmitting,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [comboType, setComboType] = useState<ComboType>('single');
  const [vegType, setVegType] = useState<FoodVegType>('non_veg');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [comboPriceInput, setComboPriceInput] = useState('');
  const [available, setAvailable] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SelectedComboItem[]>([]);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (combo) {
      setName(combo.name);
      setComboType(combo.combo_type || 'single');
      setVegType(combo.veg_type || 'non_veg');
      setDescription(combo.description || '');
      setImageUrl(combo.image_url);
      setComboPriceInput(combo.combo_price.toString());
      setAvailable(combo.available);

      if (combo.items && combo.items.length > 0) {
        const loadedItems: SelectedComboItem[] = combo.items.map((ci) => {
          const foodMatch = availableFoods.find((f) => f.id === ci.food_id);
          const variantMatch = foodMatch?.variants?.find((v) => v.id === ci.variant_id);
          const price = variantMatch?.price ?? foodMatch?.variants?.[0]?.price ?? 0;
          return {
            food_id: ci.food_id,
            food_name: foodMatch?.name || ci.food?.name || 'Dish',
            variant_id: ci.variant_id || null,
            variant_name: variantMatch?.name || 'Standard',
            unit_price: Number(price),
            quantity: ci.quantity || 1,
          };
        });
        setSelectedItems(loadedItems);
      } else {
        setSelectedItems([]);
      }
    } else {
      setName('');
      setComboType('single');
      setVegType('non_veg');
      setDescription('');
      setImageUrl(null);
      setComboPriceInput('');
      setAvailable(true);
      setSelectedItems([]);
    }
    setFoodSearchQuery('');
    setLocalError(null);
  }, [combo, availableFoods, isOpen]);

  // Filter foods for picker
  const filteredAvailableFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return availableFoods.slice(0, 10);
    const q = foodSearchQuery.toLowerCase();
    return availableFoods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category?.name?.toLowerCase().includes(q)
    );
  }, [availableFoods, foodSearchQuery]);

  // Live calculation of regular combined total
  const calculatedOriginalTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  }, [selectedItems]);

  // Live calculation of savings
  const comboPriceNum = parseFloat(comboPriceInput) || 0;
  const savings = Math.max(0, calculatedOriginalTotal - comboPriceNum);
  const discountPercent =
    calculatedOriginalTotal > 0 && savings > 0
      ? Math.round((savings / calculatedOriginalTotal) * 100)
      : 0;

  if (!isOpen) return null;

  const handleAddFoodToCombo = (food: Food) => {
    const defaultVariant = food.variants?.[0];
    const unitPrice = defaultVariant ? Number(defaultVariant.price) : 0;

    // Check if already in list
    const existingIndex = selectedItems.findIndex((it) => it.food_id === food.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          food_id: food.id,
          food_name: food.name,
          variant_id: defaultVariant?.id || null,
          variant_name: defaultVariant?.name || 'Regular',
          unit_price: unitPrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...selectedItems];
    updated[index].quantity = newQty;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    setLocalError(null);
    try {
      const res = await uploadMediaImage(file);
      setImageUrl(res.url);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to upload combo image.');
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 150) {
      setLocalError('Combo name must be between 2 and 150 characters.');
      return;
    }

    if (selectedItems.length === 0) {
      setLocalError('Please include at least 1 menu item in this combo.');
      return;
    }

    if (isNaN(comboPriceNum) || comboPriceNum <= 0) {
      setLocalError('Please enter a valid combo price greater than ₹0.');
      return;
    }

    try {
      await onSave({
        name: cleanName,
        combo_type: comboType,
        veg_type: vegType,
        description: description.trim(),
        image_url: imageUrl,
        combo_price: comboPriceNum,
        original_price: calculatedOriginalTotal,
        savings,
        available,
        items: selectedItems.map((it) => ({
          food_id: it.food_id,
          variant_id: it.variant_id || null,
          quantity: it.quantity,
        })),
      });
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save combo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-modal-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-3xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 id="combo-modal-title" className="text-sm font-bold text-slate-900">
                {combo ? `Edit Combo: ${combo.name}` : 'Create New Combo Package'}
              </h3>
              <p className="text-xs text-slate-500">
                Bundle dishes together, set a special price, and highlight savings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {localError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
              {localError}
            </div>
          )}

          {/* Section 1: Combo Details */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Combo Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Biryani + Chicken Chap Combo, Couple Feast"
                required
                maxLength={150}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Combo Structure *
              </label>
              <select
                value={comboType}
                onChange={(e) => setComboType(e.target.value as ComboType)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
              >
                {Object.entries(COMBO_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Served with Chicken Biryani, rich Chicken Chap and chilled beverage..."
                rows={2}
                maxLength={500}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dietary Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['veg', 'non_veg'] as FoodVegType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVegType(type)}
                    className={`py-2 px-3 text-center rounded border transition-colors flex items-center justify-center ${
                      vegType === type
                        ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <DietaryBadge type={type} showText={true} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Included Menu Items (Interactive Picker & Live Calculation) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Items Included in Combo *
                </span>
                <span className="text-[11px] text-slate-500">
                  Search and add dishes from your existing menu with quantities.
                </span>
              </div>
            </div>

            {/* Dish Search Selector */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Search existing dishes to add (e.g. Biryani, Chicken, Roll)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                {filteredAvailableFoods.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic p-1">No matching dishes found</span>
                ) : (
                  filteredAvailableFoods.map((f) => {
                    const price = f.variants?.[0]?.price ?? 0;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleAddFoodToCombo(f)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded text-xs text-slate-800 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold">{f.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({formatCurrency(price)})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Items List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Selected Package Items ({selectedItems.length})
              </span>

              {selectedItems.length === 0 ? (
                <div className="py-6 border border-dashed border-slate-300 rounded text-center text-xs text-slate-500 bg-white">
                  No dishes added to this combo yet. Click on dishes above to add them.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.food_name}</span>
                        <span className="text-[11px] text-slate-400">
                          @ {formatCurrency(item.unit_price)} each
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-300 rounded bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 w-16 text-right">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Automatic Price Calculations Bar */}
            <div className="pt-3 border-t border-slate-200 bg-white p-3 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wide">
                  Regular Combined Price (Auto-Calculated)
                </span>
                <span className="text-base font-bold text-slate-900 line-through text-slate-400">
                  {formatCurrency(calculatedOriginalTotal)}
                </span>
              </div>

              <div className="w-44">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Combo Offer Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={comboPriceInput}
                    onChange={(e) => setComboPriceInput(e.target.value)}
                    placeholder="e.g. 300"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-6 pr-2 py-1.5 text-sm font-bold border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wide">
                  Customer Savings
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Save {formatCurrency(savings)} {discountPercent > 0 && `(${discountPercent}% off)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photo & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Combo Photo <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Combo" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingImg ? 'Uploading...' : imageUrl ? 'Replace' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImg || isSubmitting}
                      className="hidden"
                    />
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="text-[11px] text-rose-600 hover:underline block"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center sm:justify-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  disabled={isSubmitting}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4"
                />
                <span>Combo is Available for Ordering</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImg}
              className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : combo ? 'Save Changes' : 'Create Combo Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
