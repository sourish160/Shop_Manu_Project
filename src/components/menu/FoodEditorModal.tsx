import React, { useState, useEffect } from 'react';
import { Category, Food, FoodAddon, FoodVegType, uploadMediaImage } from '../../lib/insforge';
import { DietaryBadge } from './DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { X, UploadCloud, Trash2, Plus, Clock, Tag } from 'lucide-react';

export interface FoodVariantInput {
  id?: string;
  name: string;
  price: string;
  available: boolean;
}

export interface FoodFormData {
  name: string;
  category_id: string;
  veg_type: FoodVegType;
  description: string;
  image_url: string | null;
  prep_time_minutes: number | null;
  base_price: number | null;
  discount_price: number | null;
  available: boolean;
  variants: FoodVariantInput[];
  selectedAddonIds: string[];
}

interface FoodEditorModalProps {
  isOpen: boolean;
  food: Food | null;
  categories: Category[];
  addons: FoodAddon[];
  defaultCategoryId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: FoodFormData) => Promise<void>;
  onOpenAddonManager?: () => void;
}

export const FoodEditorModal: React.FC<FoodEditorModalProps> = ({
  isOpen,
  food,
  categories,
  addons,
  defaultCategoryId,
  isSubmitting,
  onClose,
  onSave,
  onOpenAddonManager,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'addons' | 'media'>('info');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vegType, setVegType] = useState<FoodVegType>('veg');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [variants, setVariants] = useState<FoodVariantInput[]>([
    { name: 'Regular', price: '', available: true },
  ]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (food) {
      setName(food.name);
      setCategoryId(food.category_id);
      setVegType(food.veg_type || 'veg');
      setDescription(food.description || '');
      setPrepTime(food.prep_time_minutes ? food.prep_time_minutes.toString() : '');
      setBasePrice(food.base_price ? food.base_price.toString() : '');
      setDiscountPrice(food.discount_price ? food.discount_price.toString() : '');
      setAvailable(food.available);
      setImageUrl(food.image_url);
      setSelectedAddonIds(food.addon_ids || []);

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
    } else {
      setName('');
      setCategoryId(defaultCategoryId || (categories[0]?.id ?? ''));
      setVegType('veg');
      setDescription('');
      setPrepTime('20');
      setBasePrice('');
      setDiscountPrice('');
      setAvailable(true);
      setImageUrl(null);
      setSelectedAddonIds([]);
      setVariants([{ name: 'Regular', price: '', available: true }]);
    }
    setActiveTab('info');
    setLocalError(null);
  }, [food, categories, defaultCategoryId, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    setLocalError(null);
    try {
      const res = await uploadMediaImage(file);
      setImageUrl(res.url);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to upload dish image.');
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: '', available: true }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 150) {
      setLocalError('Food name must be between 2 and 150 characters.');
      setActiveTab('info');
      return;
    }

    if (!categoryId) {
      setLocalError('Please select a category for this dish.');
      setActiveTab('info');
      return;
    }

    if (variants.length === 0) {
      setLocalError('At least one variant with a price is required.');
      setActiveTab('pricing');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.name.trim()) {
        setLocalError(`Variant #${i + 1} name is required (e.g. Regular, Half, Full).`);
        setActiveTab('pricing');
        return;
      }
      const p = parseFloat(v.price);
      if (isNaN(p) || p < 0) {
        setLocalError(`Variant "${v.name}" must have a valid price.`);
        setActiveTab('pricing');
        return;
      }
    }

    const parsedPrep = prepTime ? parseInt(prepTime, 10) : null;
    const parsedBase = basePrice ? parseFloat(basePrice) : null;
    const parsedDiscount = discountPrice ? parseFloat(discountPrice) : null;

    try {
      await onSave({
        name: cleanName,
        category_id: categoryId,
        veg_type: vegType,
        description: description.trim(),
        image_url: imageUrl,
        prep_time_minutes: parsedPrep,
        base_price: parsedBase,
        discount_price: parsedDiscount,
        available,
        variants,
        selectedAddonIds,
      });
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save food item.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-modal-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-2xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 id="food-modal-title" className="text-sm font-bold text-slate-900">
              {food ? `Edit Dish: ${food.name}` : 'Add New Food Item'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure classification, variant pricing, options, and photo.
            </p>
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

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 flex space-x-2 bg-white text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'pricing'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pricing & Variants</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
              {variants.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addons')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'addons'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Add-ons</span>
            {selectedAddonIds.length > 0 && (
              <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded">
                {selectedAddonIds.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Photo {imageUrl && '•'}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
          <div className="space-y-4">
            {localError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {localError}
              </div>
            )}

            {/* TAB 1: BASIC INFO */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chicken Dum Biryani, Paneer Butter Masala"
                    required
                    maxLength={150}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Dietary Classification *
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Food Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Aromatic basmati rice cooked with chicken and traditional spices..."
                    rows={3}
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Clear ingredient and preparation notes help customers order with confidence.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preparation Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="25"
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-14 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">
                        mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4"
                      />
                      <span>Item is Available for Orders</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & VARIANTS */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Dish Portions & Variants *
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Configure sizes or servings with individual prices (e.g. Regular, Half, Full, Large).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-300 rounded hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                    >
                      <div className="w-full sm:flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                          Variant Name
                        </label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          placeholder="e.g. Regular / Half / Full / Large"
                          required
                          disabled={isSubmitting}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-700"
                        />
                      </div>

                      <div className="w-32 shrink-0">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
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
                            placeholder="250"
                            required
                            disabled={isSubmitting}
                            className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-700"
                          />
                        </div>
                      </div>

                      <div className="w-24 shrink-0 flex items-center pt-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={v.available}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].available = e.target.checked;
                              setVariants(updated);
                            }}
                            disabled={isSubmitting}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                          <span className="text-[11px] text-slate-600 font-medium">Available</span>
                        </label>
                      </div>

                      {variants.length > 1 && (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Promotional / Strike Price <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="e.g. 280 (Original/Menu Board)"
                        disabled={isSubmitting}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Discounted Price <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        placeholder="e.g. 250 (Offer Price)"
                        disabled={isSubmitting}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ADD-ONS */}
            {activeTab === 'addons' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Attach Reusable Add-ons
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Select which add-ons customers can customize this dish with.
                    </span>
                  </div>
                  {onOpenAddonManager && (
                    <button
                      type="button"
                      onClick={onOpenAddonManager}
                      className="text-xs text-slate-800 font-semibold underline hover:text-slate-900"
                    >
                      + Manage Shop Add-ons
                    </button>
                  )}
                </div>

                {addons.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-md text-center text-xs text-slate-500">
                    <p className="mb-2">No add-ons created for this shop yet.</p>
                    {onOpenAddonManager && (
                      <button
                        type="button"
                        onClick={onOpenAddonManager}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                      >
                        Create Add-ons (e.g. Extra Chicken, Extra Cheese)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {addons.map((ad) => {
                      const isChecked = selectedAddonIds.includes(ad.id);
                      return (
                        <label
                          key={ad.id}
                          className={`p-3 rounded-md border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                            isChecked
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddon(ad.id)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0"
                            />
                            <span className="font-semibold">{ad.name}</span>
                          </div>
                          <span className={isChecked ? 'text-slate-300' : 'text-slate-500 font-medium'}>
                            +{formatCurrency(ad.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MEDIA */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Dish Photo
                  </span>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Upload a high quality photo of this dish. JPEG, PNG or WebP up to 5 MB.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 rounded-md bg-slate-50">
                    <div className="w-28 h-28 rounded-md border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Dish preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Tag className="w-6 h-6 mx-auto mb-1 stroke-1" />
                          <span className="text-[10px] font-medium block">No Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 hover:bg-slate-100 shadow-sm transition-colors">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isUploadingImg ? 'Uploading...' : imageUrl ? 'Replace Photo' : 'Upload Photo'}</span>
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
                            disabled={isSubmitting}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 rounded hover:bg-rose-50"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Dishes with clear real photos see significantly higher customer engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0 mt-6">
            <span className="text-[11px] text-slate-400 font-medium">
              * Required fields: Name, Category, Dietary Type, at least 1 Variant Price
            </span>
            <div className="flex items-center gap-2">
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
                {isSubmitting ? 'Saving...' : food ? 'Save Changes' : 'Create Food Item'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
