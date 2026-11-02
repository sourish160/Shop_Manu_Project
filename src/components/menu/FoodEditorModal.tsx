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

  // Variant States
  const [variants, setVariants] = useState<FoodVariantInput[]>([
    { name: 'Regular', price: '', available: true },
  ]);

  // Selected Add-ons
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Image Upload state
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (food) {
      setName(food.name);
      setCategoryId(food.category_id || defaultCategoryId || categories[0]?.id || '');
      setVegType(food.veg_type || 'veg');
      setDescription(food.description || '');
      setPrepTime(food.prep_time_minutes ? String(food.prep_time_minutes) : '');
      setBasePrice(food.base_price !== null && food.base_price !== undefined ? String(food.base_price) : '');
      setDiscountPrice(food.discount_price !== null && food.discount_price !== undefined ? String(food.discount_price) : '');
      setAvailable(food.available ?? true);
      setImageUrl(food.image_url || null);

      if (food.variants && food.variants.length > 0) {
        setVariants(
          food.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: String(v.price),
            available: v.available,
          }))
        );
      } else {
        setVariants([
          {
            name: 'Regular',
            price: food.base_price ? String(food.base_price) : '',
            available: true,
          },
        ]);
      }

      if (food.addons) {
        setSelectedAddonIds(food.addons.map((a) => a.id));
      } else if (food.addon_ids) {
        setSelectedAddonIds(food.addon_ids);
      } else {
        setSelectedAddonIds([]);
      }
    } else {
      setName('');
      setCategoryId(defaultCategoryId || categories[0]?.id || '');
      setVegType('veg');
      setDescription('');
      setPrepTime('20');
      setBasePrice('');
      setDiscountPrice('');
      setAvailable(true);
      setImageUrl(null);
      setVariants([{ name: 'Regular', price: '', available: true }]);
      setSelectedAddonIds([]);
    }
    setActiveTab('info');
    setLocalError(null);
  }, [food, defaultCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: '', available: true }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImg(true);
      setLocalError(null);
      const res = await uploadMediaImage(file);
      setImageUrl(res.url);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Failed to upload dish image.');
    } finally {
      setIsUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setLocalError('Food dish name must be at least 2 characters.');
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
    const parsedBase = basePrice ? parseFloat(basePrice) : parseFloat(variants[0].price) || null;
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
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save food item.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-modal-title"
        className="bg-[#1C1512] rounded-3xl border border-[#382820] shadow-2xl max-w-2xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden text-[#F5EDE5]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#382820] flex items-center justify-between bg-[#241A15] shrink-0">
          <div>
            <h3 id="food-modal-title" className="text-base font-serif font-medium text-[#F5EDE5]">
              {food ? `Edit Dish: ${food.name}` : 'Add New Food Item'}
            </h3>
            <p className="text-[11px] text-[#B6A69A]">
              Configure classification, variant pricing, options, and photo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1.5 rounded-lg hover:bg-[#1C1512] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-[#382820] flex space-x-2 bg-[#1C1512] text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#E9A052] text-[#E9A052]'
                : 'border-transparent text-[#B6A69A] hover:text-[#F5EDE5]'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-[#E9A052] text-[#E9A052]'
                : 'border-transparent text-[#B6A69A] hover:text-[#F5EDE5]'
            }`}
          >
            <span>Pricing &amp; Variants</span>
            <span className="text-[10px] bg-[#241A15] border border-[#382820] px-1.5 py-0.2 rounded text-[#E9A052]">
              {variants.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addons')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'addons'
                ? 'border-[#E9A052] text-[#E9A052]'
                : 'border-transparent text-[#B6A69A] hover:text-[#F5EDE5]'
            }`}
          >
            <span>Add-ons</span>
            {selectedAddonIds.length > 0 && (
              <span className="text-[10px] bg-[#E9A052] text-[#100D0B] font-bold px-1.5 py-0.2 rounded">
                {selectedAddonIds.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'media'
                ? 'border-[#E9A052] text-[#E9A052]'
                : 'border-transparent text-[#B6A69A] hover:text-[#F5EDE5]'
            }`}
          >
            Photo {imageUrl && '•'}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
          <div className="space-y-4">
            {localError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl">
                {localError}
              </div>
            )}

            {/* TAB 1: BASIC INFO */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052]"
                    >
                      <option value="" disabled className="bg-[#1C1512]">
                        Select a category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#1C1512]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
                      Dietary Classification *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['veg', 'non_veg'] as FoodVegType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setVegType(type)}
                          className={`py-2 px-3 text-center rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                            vegType === type
                              ? 'border-[#E9A052] bg-[#241A15] text-[#E9A052] font-semibold'
                              : 'border-[#382820] bg-[#1C1512] text-[#B6A69A] hover:bg-[#241A15]'
                          }`}
                        >
                          <DietaryBadge type={type} showText={true} size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
                    Food Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Aromatic basmati rice cooked with chicken and traditional spices..."
                    rows={3}
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052] resize-none"
                  />
                  <span className="text-[11px] text-[#B6A69A]/70 block mt-1 font-mono">
                    Clear ingredient and preparation notes help customers order with confidence.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
                      Preparation Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-2.5 text-[#B6A69A]/70" />
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="25"
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-14 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[#B6A69A] font-mono">
                        mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#F5EDE5]">
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded border-[#382820] bg-[#241A15] text-[#E9A052] focus:ring-0 w-4 h-4 cursor-pointer"
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
                    <span className="text-xs font-mono uppercase tracking-wider text-[#B6A69A] block">
                      Dish Portions &amp; Variants *
                    </span>
                    <span className="text-[11px] text-[#B6A69A]/70">
                      Configure sizes or servings with individual prices (e.g. Regular, Half, Full, Large).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#E9A052] bg-[#241A15] border border-[#382820] rounded-xl hover:border-[#E9A052]/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#241A15] border border-[#382820] rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                    >
                      <div className="w-full sm:flex-1">
                        <label className="block text-[10px] font-mono uppercase text-[#B6A69A] mb-0.5">
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
                          className="w-full px-2.5 py-1.5 text-xs bg-[#1C1512] border border-[#382820] rounded-lg text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                        />
                      </div>

                      <div className="w-32 shrink-0">
                        <label className="block text-[10px] font-mono uppercase text-[#B6A69A] mb-0.5">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-[#E9A052] font-mono">₹</span>
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
                            className="w-full pl-6 pr-2 py-1.5 text-xs bg-[#1C1512] border border-[#382820] rounded-lg text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
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
                            className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0"
                          />
                          <span className="text-[11px] text-[#B6A69A] font-medium">Available</span>
                        </label>
                      </div>

                      {variants.length > 1 && (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-[#B6A69A] hover:text-rose-400 rounded-lg"
                            title="Remove variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#382820] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1">
                      Promotional Strike Price <span className="text-[#B6A69A]/50">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#E9A052] font-mono">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="e.g. 280 (Menu Board)"
                        disabled={isSubmitting}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1">
                      Discounted Price <span className="text-[#B6A69A]/50">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#E9A052] font-mono">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        placeholder="e.g. 250 (Offer Price)"
                        disabled={isSubmitting}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
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
                    <span className="text-xs font-mono uppercase tracking-wider text-[#B6A69A] block">
                      Attach Reusable Add-ons
                    </span>
                    <span className="text-[11px] text-[#B6A69A]/70">
                      Select which add-ons customers can customize this dish with.
                    </span>
                  </div>
                  {onOpenAddonManager && (
                    <button
                      type="button"
                      onClick={onOpenAddonManager}
                      className="text-xs text-[#E9A052] font-semibold hover:underline cursor-pointer"
                    >
                      + Manage Shop Add-ons
                    </button>
                  )}
                </div>

                {addons.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#382820] rounded-2xl text-center text-xs text-[#B6A69A] bg-[#241A15]/40">
                    <p className="mb-3">No add-ons created for this shop yet.</p>
                    {onOpenAddonManager && (
                      <button
                        type="button"
                        onClick={onOpenAddonManager}
                        className="px-4 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        Create Add-ons (e.g. Extra Raita, Extra Cheese)
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
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                            isChecked
                              ? 'bg-[#241A15] text-[#E9A052] border-[#E9A052]'
                              : 'bg-[#1C1512] text-[#F5EDE5] border-[#382820] hover:border-[#382820]/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddon(ad.id)}
                              className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0"
                            />
                            <span className="font-medium">{ad.name}</span>
                          </div>
                          <span className={isChecked ? 'text-[#E9A052]' : 'text-[#B6A69A] font-mono'}>
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
                  <span className="text-xs font-mono uppercase tracking-wider text-[#B6A69A] block mb-1">
                    Dish Photo
                  </span>
                  <p className="text-[11px] text-[#B6A69A]/70 mb-3">
                    Upload a high-quality photo of this dish. JPEG, PNG or WebP up to 5 MB.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-[#382820] rounded-2xl bg-[#241A15]">
                    <div className="w-28 h-28 rounded-xl border border-[#382820] bg-[#1C1512] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Dish preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.no-photo-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div className={`no-photo-fallback text-center p-2 text-[#B6A69A]/60 ${imageUrl ? 'hidden' : 'block'}`}>
                        <Tag className="w-6 h-6 mx-auto mb-1 stroke-1" />
                        <span className="text-[10px] font-medium block">No Photo</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] rounded-xl text-xs font-semibold shadow-sm transition-all">
                          <UploadCloud className="w-4 h-4" />
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
                            className="px-3 py-2 text-xs font-semibold text-rose-400 border border-rose-900/60 rounded-xl hover:bg-rose-950/40"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#B6A69A]/70 font-mono">
                        Dishes with clear real photos see significantly higher customer engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#382820] flex items-center justify-between shrink-0 mt-6">
            <span className="text-[11px] text-[#B6A69A]/70 font-mono">
              * Required: Name, Category, Dietary Type, Price
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-[#382820] rounded-xl text-xs font-medium text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#241A15] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImg}
                className="px-5 py-2 bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
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
