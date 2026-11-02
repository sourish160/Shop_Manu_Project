import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isConfirmDisabled = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-[#1C1512] rounded-2xl border border-[#382820] shadow-2xl max-w-sm w-full overflow-hidden p-5"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
                : variant === 'warning'
                ? 'bg-[#241A15] text-[#E9A052] border border-[#382820]'
                : 'bg-[#241A15] text-[#F5EDE5] border border-[#382820]'
            }`}
          >
            {variant === 'danger' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
              {title}
            </h3>
            <p className="text-xs text-[#B6A69A] mt-1 leading-relaxed">{message}</p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1 rounded-lg hover:bg-[#241A15] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-[#382820] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-[#382820] rounded-xl text-xs font-medium text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#241A15] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          {!isConfirmDisabled && (
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : variant === 'warning'
                  ? 'bg-[#E9A052] hover:bg-amber-400 text-[#100D0B]'
                  : 'bg-[#241A15] hover:bg-[#2C201A] text-[#F5EDE5] border border-[#382820]'
              }`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
