import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#230d43] border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text */}
        <div className="space-y-2 py-1">
          <p className="text-xs text-purple-200 leading-relaxed font-medium">
            هل أنت متأكد من رغبتك في حذف:
          </p>
          <div className="p-3 bg-purple-950/60 border border-purple-800/60 rounded-xl text-white font-bold text-sm break-words">
            {itemName}
          </div>
          <p className="text-[11px] text-rose-300 font-semibold">
            ⚠️ هذا الإجراء نهائي ولا يمكن التراجع عنه.
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/40 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>نعم، احذف</span>
          </button>
        </div>
      </div>
    </div>
  );
};
