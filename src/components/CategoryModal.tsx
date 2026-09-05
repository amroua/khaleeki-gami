import React, { useState, useRef } from 'react';
import { CategoryItem } from '../types';
import { Save, X, Sparkles, Palette, Check, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { CATEGORY_THEMES, getCategoryTheme } from '../data/categoryThemes';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
  existingCount?: number;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  existingCount = 1
}) => {
  const [title, setTitle] = useState(categoryToEdit?.title || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [iconEmoji, setIconEmoji] = useState(categoryToEdit?.iconEmoji || '🧴');
  const [imageUrl, setImageUrl] = useState(categoryToEdit?.imageUrl || '');
  const [selectedColor, setSelectedColor] = useState<string>(
    categoryToEdit?.color || getCategoryTheme(undefined, existingCount).id
  );
  const [status, setStatus] = useState<'available' | 'coming_soon'>(
    categoryToEdit ? (categoryToEdit.isAvailable !== false ? 'available' : 'coming_soon') : 'available'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('يرجى إدخال اسم القسم');
      return;
    }

    const isAvailable = status === 'available';
    const badgeText = isAvailable ? 'متاح للبدء' : 'قريباً';
    const theme = getCategoryTheme(selectedColor, existingCount);

    const newCat: CategoryItem = {
      id: categoryToEdit?.id || `cat-${Date.now()}`,
      title: title.trim(),
      subtitle: categoryToEdit?.subtitle || '',
      iconName: categoryToEdit?.iconName || 'Sparkles',
      iconEmoji: iconEmoji.trim() || '🧴',
      imageUrl: imageUrl.trim() || undefined,
      color: theme.id,
      bgColor: theme.cardBg,
      borderColor: theme.border,
      isAvailable,
      badgeText,
      description: description.trim(),
      order: categoryToEdit?.order || existingCount + 1
    };

    onSave(newCat);
    onClose();
  };

  const emojiPresets = ['💄', '💋', '💅', '🧴', '🧖‍♀️', '✨', '🌸', '💆‍♀️', '💇‍♀️', '👄', '👁️', '🌿', '🫧', '☀️', '🌹', '🪞', '🧼', '⚖️', '🔥', '🍑'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-[#210a40] border border-purple-700/70 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {categoryToEdit ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">
              اسم القسم <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مستحضرات العناية بالبشرة والوجه"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-[#16062a] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-bold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">وصف القسم</label>
            <textarea
              rows={2}
              placeholder="وصف مختصر للمنتجات والتركيبات المشمولة في هذا القسم..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#16062a] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 resize-none font-medium"
            />
          </div>

          {/* Category Color Palette Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span>لون وهوية القسم التجميلية</span>
              </span>
              <span className="text-[11px] text-pink-300 font-semibold">
                {getCategoryTheme(selectedColor).name}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2 bg-[#16062a] p-2.5 rounded-2xl border border-purple-800/50">
              {CATEGORY_THEMES.map((th) => {
                const isSelected = selectedColor === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedColor(th.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white bg-purple-900/60 shadow-md scale-105'
                        : 'border-purple-800/40 hover:border-purple-600 bg-[#1c0836]'
                    }`}
                    title={th.name}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shadow-inner relative"
                      style={{ backgroundColor: th.previewColor }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-bold text-purple-200 truncate w-full text-center">
                      {th.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon / Emoji Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">الأيقونة / الإيموجي</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                placeholder="🧴"
                className="w-14 h-11 bg-[#16062a] border border-purple-700/60 rounded-xl text-center text-xl text-white focus:outline-none focus:border-purple-400 select-all font-mono"
              />
              {/* Quick Pick Emojis */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {emojiPresets.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIconEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                      iconEmoji === emoji
                        ? 'bg-purple-600 text-white scale-110 shadow-sm border border-purple-400'
                        : 'bg-[#16062a] hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Category Image */}
          <div className="space-y-2 bg-[#16062a] p-3 rounded-2xl border border-purple-800/50">
            <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>صورة القسم (اختيارية)</span>
              </span>
              <span className="text-[10px] text-purple-400 font-normal">تظهر أسفل اسم القسم في الواجهة</span>
            </label>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-purple-700/60 bg-purple-950/40 p-2 flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="معاينة صورة القسم"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow-sm"
                />
                <div className="flex-1 text-right space-y-1">
                  <span className="text-xs font-bold text-white block">تم تحديد صورة للقسم</span>
                  <span className="text-[10px] text-pink-300 block truncate max-w-[180px]">
                    {imageUrl.startsWith('data:') ? 'صورة مرفوعة من الجهاز' : imageUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-2 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="رابط الصورة (URL) https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-[#1c0836] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-mono"
                    dir="ltr"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-purple-800/80 hover:bg-purple-700 text-purple-200 hover:text-white rounded-xl text-xs font-bold border border-purple-600/50 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">حالة القسم</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  status === 'available'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50'
                    : 'bg-[#16062a] border-purple-800/60 text-purple-300 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>متاح للبدء</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('coming_soon')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  status === 'coming_soon'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-md shadow-amber-950/50'
                    : 'bg-[#16062a] border-purple-800/60 text-purple-300 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>قريباً</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-purple-800/50">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/60 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{categoryToEdit ? 'حفظ التعديلات' : 'إضافة القسم'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

