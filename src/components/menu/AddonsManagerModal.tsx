import React, { useState } from 'react';
import { FoodAddon, insforge } from '../../lib/insforge';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2, Edit2, X, Check, Layers } from 'lucide-react';

interface AddonsManagerModalProps {
  isOpen: boolean;
  restaurantId: string;
  addons: FoodAddon[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export const AddonsManagerModal: React.FC<AddonsManagerModalProps> = ({
  isOpen,
  restaurantId,
  addons,
  onClose,
  onRefresh,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [editingAddon, setEditingAddon] = useState<FoodAddon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numPrice = parseFloat(price);

    if (!cleanName) {
      setErrorMsg('Add-on name is required.');
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a valid price (₹0 or greater).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingAddon) {
        const { error } = await insforge.database
          .from('food_addons')
          .update({
            name: cleanName,
            price: numPrice,
            available,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddon.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await insforge.database.from('food_addons').insert([
          {
            restaurant_id: restaurantId,
            name: cleanName,
            price: numPrice,
            available,
          },
        ]);

        if (error) throw new Error(error.message);
      }

      setName('');
      setPrice('');
      setAvailable(true);
      setEditingAddon(null);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save add-on.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (addon: FoodAddon) => {
    setEditingAddon(addon);
    setName(addon.name);
    setPrice(addon.price.toString());
    setAvailable(addon.available);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingAddon(null);
    setName('');
    setPrice('');
    setAvailable(true);
    setErrorMsg(null);
  };

  const handleToggleAvailable = async (addon: FoodAddon) => {
    try {
      const nextStatus = !addon.available;
      const { error } = await insforge.database
        .from('food_addons')
        .update({ available: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', addon.id);

      if (error) throw new Error(error.message);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update availability.');
    }
  };

  const handleDelete = async (addon: FoodAddon) => {
    if (!confirm(`Are you sure you want to delete add-on "${addon.name}"?`)) return;
    try {
      const { error } = await insforge.database.from('food_addons').delete().eq('id', addon.id);
      if (error) throw new Error(error.message);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete add-on.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="addons-manager-title"
        className="bg-[#1C1512] rounded-2xl border border-[#382820] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] text-[#F5EDE5]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#382820] flex items-center justify-between bg-[#241A15]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1512] text-[#E9A052] border border-[#382820] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 id="addons-manager-title" className="text-base font-serif font-medium text-[#F5EDE5]">
                Manage Shop Add-ons
              </h3>
              <p className="text-xs text-[#B6A69A]">
                Reusable options like Extra Chicken, Extra Cheese, Raita, etc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1.5 rounded-xl hover:bg-[#1C1512] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Add / Edit Form */}
          <form
            onSubmit={handleSave}
            className="p-4 bg-[#241A15] border border-[#382820] rounded-2xl space-y-3.5"
          >
            <span className="text-xs font-serif font-medium text-[#F5EDE5] block">
              {editingAddon ? 'Edit Add-on' : 'Add New Reusable Add-on'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Extra Chicken, Extra Cheese, Raita"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs border border-[#382820] rounded-xl bg-[#1C1512] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="80"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#382820] rounded-xl bg-[#1C1512] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
                />
              </div>

              <div className="sm:col-span-3 flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#F5EDE5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="rounded border-[#382820] bg-[#1C1512] text-[#E9A052] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Available</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              {editingAddon && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 border border-[#382820] rounded-xl text-xs font-medium text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#1C1512] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {editingAddon ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Saving...' : editingAddon ? 'Update' : 'Add Option'}</span>
              </button>
            </div>
          </form>

          {/* Existing Addons List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase font-bold text-[#B6A69A] tracking-wider">
                Configured Add-ons ({addons.length})
              </span>
            </div>

            {addons.length === 0 ? (
              <div className="p-6 border border-dashed border-[#382820] rounded-xl text-center text-xs text-[#B6A69A]">
                No add-ons created yet. Create add-ons above to attach them to dishes (e.g. Extra Cheese, Raita).
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {addons.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#241A15] border border-[#382820] rounded-xl flex items-center justify-between text-xs hover:border-[#E9A052]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(item)}
                        className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                          item.available ? 'bg-emerald-400' : 'bg-[#382820]'
                        }`}
                        title={item.available ? 'Available (click to toggle)' : 'Unavailable (click to toggle)'}
                      />
                      <span className="font-semibold text-[#F5EDE5]">{item.name}</span>
                      <span className="text-[#E9A052] font-mono font-medium">+{formatCurrency(item.price)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#1C1512] rounded-lg transition-colors cursor-pointer"
                        title="Edit add-on"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-[#B6A69A] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete add-on"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#382820] bg-[#241A15] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
