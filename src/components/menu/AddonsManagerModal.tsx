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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="addons-manager-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-200/80 text-slate-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 id="addons-manager-title" className="text-sm font-bold text-slate-900">
                Manage Shop Add-ons
              </h3>
              <p className="text-xs text-slate-500">
                Reusable options like Extra Chicken, Extra Cheese, Raita, etc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          {/* Add / Edit Form */}
          <form
            onSubmit={handleSave}
            className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3"
          >
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              {editingAddon ? 'Edit Add-on' : 'Add New Reusable Add-on'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Extra Chicken, Extra Cheese, Raita"
                  required
                  disabled={isSubmitting}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="sm:col-span-3 flex items-end pb-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Available</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingAddon && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-3.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 shadow-sm"
              >
                {editingAddon ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Saving...' : editingAddon ? 'Update' : 'Add Option'}</span>
              </button>
            </div>
          </form>

          {/* Existing Addons List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Configured Add-ons ({addons.length})
              </span>
            </div>

            {addons.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 rounded text-center text-xs text-slate-500">
                No add-ons created yet. Create add-ons above to attach them to dishes (e.g. Extra Cheese, Raita).
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {addons.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(item)}
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.available ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={item.available ? 'Available (click to toggle)' : 'Unavailable (click to toggle)'}
                      />
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-slate-400 font-medium">+{formatCurrency(item.price)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Edit add-on"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
