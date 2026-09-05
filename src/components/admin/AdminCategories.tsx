import React, { useState, useRef } from 'react';
import { CategoryItem } from '../../types';
import { Plus, FolderPlus, Edit, Trash2, CheckCircle2, Save, X, Image as ImageIcon, Upload, Palette } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CATEGORY_THEMES, getCategoryTheme } from '../../data/categoryThemes';

interface AdminCategoriesProps {
  categories: CategoryItem[];
  onSaveCategory: (category: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  onSaveCategory,
  onDeleteCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    id: '',
    title: '',
    subtitle: '',
    iconEmoji: '🧴',
    imageUrl: '',
    isAvailable: true,
    badgeText: 'متاح الآن',
    description: '',
    order: categories.length + 1
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      id: `cat-${Date.now()}`,
      title: '',
      subtitle: '',
      iconEmoji: '🧴',
      imageUrl: '',
      isAvailable: true,
      badgeText: 'متاح الآن',
      description: '',
      order: categories.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    const payload: CategoryItem = {
      id: editingCategory?.id || formData.id || `cat-${Date.now()}`,
      title: formData.title.trim(),
      subtitle: formData.subtitle?.trim() || '',
      iconName: 'Sparkles',
      iconEmoji: formData.iconEmoji?.trim() || '🧴',
      imageUrl: formData.imageUrl?.trim() || undefined,
      color: formData.color || 'text-purple-400',
      bgColor: formData.bgColor || 'bg-purple-500/10',
      borderColor: formData.borderColor || 'border-purple-500/30',
      isAvailable: formData.isAvailable !== false,
      badgeText: formData.badgeText?.trim() || 'متاح الآن',
      description: formData.description?.trim() || '',
      order: Number(formData.order) || 1
    };

    onSaveCategory(payload);
    setIsModalOpen(false);
  };

  const emojiPresets = ['💄', '💋', '💅', '🧴', '🧖‍♀️', '✨', '🌸', '💆‍♀️', '💇‍♀️', '👄', '👁️', '🌿', '🫧', '☀️', '🌹', '🪞', '🧼', '⚖️', '🔥', '🍑'];

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">إدارة الأقسام والمجالات الصناعية</h4>
            <p className="text-[11px] text-purple-300">أضف أقساماً جديدة مثل مستحضرات التجميل، الصناعات الغذائية، وغيرها</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-900/50"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#210a40] border border-purple-700/60 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 shadow-md hover:border-purple-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-900/80 border border-purple-600/50 flex items-center justify-center text-2xl select-none flex-shrink-0 shadow-inner">
                {cat.iconEmoji || '🧴'}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white">{cat.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {cat.badgeText || 'متاح'}
                  </span>
                </div>
                {cat.imageUrl && (
                  <div className="my-1.5 w-16 h-12 rounded-lg overflow-hidden border border-purple-500/40 bg-black/40">
                    <img
                      src={cat.imageUrl}
                      alt={cat.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {cat.description && (
                  <p className="text-xs text-purple-200 line-clamp-2 font-medium leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-2 text-purple-200 hover:text-white bg-purple-800/50 hover:bg-purple-700/60 border border-purple-600/50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="تعديل القسم"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              {cat.id !== 'detergents' && (
                <button
                  onClick={() => setDeletingCategory(cat)}
                  className="p-2 text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="حذف القسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {editingCategory ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">اسم القسم / المجال *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: صناعة مستحضرات التجميل"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">أيقونة (Emoji)</label>
                  <input
                    type="text"
                    placeholder="🧴 / 💄 / 🍯"
                    value={formData.iconEmoji || ''}
                    onChange={(e) => setFormData({ ...formData, iconEmoji: e.target.value })}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-center text-base text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Emoji quick presets */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-purple-300">اختر إيموجي تجميلي سريع:</label>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                  {emojiPresets.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, iconEmoji: emoji })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${
                        formData.iconEmoji === emoji
                          ? 'bg-purple-600 text-white border border-purple-300 scale-110'
                          : 'bg-[#180730] hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Color Border Theme */}
              <div className="space-y-1.5 bg-[#180730] p-3 rounded-2xl border border-purple-800/50">
                <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    <span>لون إطار وحواف القسم (Border)</span>
                  </span>
                  <span className="text-[10px] text-pink-300 font-semibold">
                    {getCategoryTheme(formData.color).name}
                  </span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                  {CATEGORY_THEMES.map((th) => {
                    const isSelected = formData.color === th.id || formData.borderColor === th.border;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            color: th.id,
                            bgColor: th.cardBg,
                            borderColor: th.border,
                            badgeBg: th.badge
                          })
                        }
                        className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-white bg-purple-900/60 ring-2 ring-white/60 scale-105 shadow-md'
                            : 'border-purple-800/40 bg-[#120424] hover:bg-purple-900/30'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: th.previewColor }}
                        />
                        <span className="text-[9px] font-bold text-purple-200 truncate w-full text-center">
                          {th.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Image Upload / URL */}
              <div className="space-y-2 bg-[#180730] p-3 rounded-2xl border border-purple-800/50">
                <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>صورة القسم (اختيارية)</span>
                  </span>
                  <span className="text-[10px] text-purple-400 font-normal">صورة صغيرة في الواجهة</span>
                </label>

                {formData.imageUrl ? (
                  <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-purple-700/40">
                    <img
                      src={formData.imageUrl}
                      alt="معاينة"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                    <div className="flex-1 truncate text-[11px] text-purple-200">
                      {formData.imageUrl.startsWith('data:') ? 'صورة تم رفعها' : formData.imageUrl}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="رابط الصورة https://..."
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 bg-[#120424] border border-purple-700/60 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-purple-400/40 focus:outline-none"
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
                      className="px-2.5 py-1.5 bg-purple-800/80 hover:bg-purple-700 text-purple-200 hover:text-white rounded-xl text-xs font-bold border border-purple-600/50 flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <Upload className="w-3 h-3" />
                      <span>رفع</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">وصف القسم</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر للمشاريع والتركيبات المندرجة تحت هذا القسم..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">شارة التوفر (Badge)</label>
                  <input
                    type="text"
                    placeholder="متاح الآن / قريباً"
                    value={formData.badgeText || 'متاح الآن'}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">الترتيب</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order || 1}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-purple-800/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/50 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ القسم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCategory}
        title="حذف القسم الصناعي"
        itemName={deletingCategory?.title || ''}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            onDeleteCategory(deletingCategory.id);
          }
        }}
      />
    </div>
  );
};
