import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Bell, X } from 'lucide-react';
import { IndustryCategory } from '../types';

interface CategoryComingSoonModalProps {
  category: IndustryCategory | null;
  onClose: () => void;
}

export const CategoryComingSoonModal: React.FC<CategoryComingSoonModalProps> = ({
  category,
  onClose
}) => {
  const [subscribed, setSubscribed] = useState(false);

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
        <div className="flex items-start justify-between gap-3 border-b border-purple-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-900/80 text-purple-300 border border-purple-700/50">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-purple-300 bg-purple-900/60 border border-purple-700/40 px-2 py-0.5 rounded-md">
                قريباً
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">{category.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-purple-200 leading-relaxed font-medium">
          {category.description}
        </p>

        {/* Action Button */}
        {subscribed ? (
          <div className="bg-purple-900/60 border border-purple-600/50 text-purple-200 text-xs font-bold p-3 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>سيتم إشعارك فور إتاحة هذا القسم.</span>
          </div>
        ) : (
          <button
            onClick={() => setSubscribed(true)}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-900/50"
          >
            <Bell className="w-4 h-4" />
            <span>نبّهني عند توفر هذا القسم</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          الرجوع للمجالات المتاحة
        </button>
      </div>
    </div>
  );
};
