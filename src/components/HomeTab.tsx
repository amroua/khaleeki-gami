import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import { CategoryItem } from '../types';
import { getCategories, saveCategory, deleteCategory, isUserAdmin, CMS_UPDATED_EVENT } from '../services/storageService';
import { CategoryModal } from './CategoryModal';
import { DeleteConfirmModal } from './admin/DeleteConfirmModal';
import { getCategoryTheme } from '../data/categoryThemes';

interface HomeTabProps {
  onSelectCategory: (category: CategoryItem) => void;
  isAdmin?: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onSelectCategory, isAdmin }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const adminActive = isAdmin ?? isUserAdmin();

  useEffect(() => {
    setCategories(getCategories());

    const handleUpdate = () => {
      setCategories(getCategories());
    };

    window.addEventListener(CMS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const handleOpenAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, cat: CategoryItem) => {
    e.stopPropagation();
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleOpenDelete = (e: React.MouseEvent, cat: CategoryItem) => {
    e.stopPropagation();
    setCategoryToDelete(cat);
  };

  const handleSaveCategory = (category: CategoryItem) => {
    saveCategory(category);
    setIsCategoryModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  return (
    <div id="home-tab-content" className="space-y-5 pb-20 pt-2 animate-in fade-in duration-200" dir="rtl">
      {/* Header section: "أهلاً بيكِ 🌸" + Admin Add Button */}
      <section id="home-header-greeting" className="space-y-2 text-right">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>أهلاً بيكِ</span>
              <span className="text-2xl select-none" role="img" aria-label="تحية">🌸</span>
            </h1>
            <p className="text-xs sm:text-sm text-pink-200 font-bold mt-1">
              اختاري قسم مستحضرات التجميل والعناية للبدء
            </p>
          </div>

          {/* Admin-Only: Add New Category Button */}
          {adminActive && (
            <button
              id="admin-add-category-btn"
              type="button"
              onClick={handleOpenAdd}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-950/70 border border-pink-400/30 transition-all cursor-pointer"
              title="إضافة قسم جديد (للأدمن فقط)"
            >
              <Plus className="w-4 h-4 text-pink-100" />
              <span>➕ إضافة قسم</span>
            </button>
          )}
        </div>
      </section>

      {/* Categories Grid / Cards Layout (2 columns on mobile, 3 on md+) */}
      <section id="available-industry-section">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((cat, idx) => {
            const theme = getCategoryTheme(cat.color, idx);
            const cardBackground = cat.bgColor || theme.cardBg;
            const cardBorder = cat.borderColor || theme.border;

            return (
              <div
                key={cat.id}
                id={`card-${cat.id}-container`}
                className={`relative group rounded-3xl p-4 sm:p-5 border ${cardBorder} ${cardBackground} shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-2xl cursor-pointer min-h-[160px] sm:min-h-[180px]`}
                onClick={() => onSelectCategory(cat)}
              >
                {/* Subtle Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Icon + Badge + Admin Controls */}
                <div className="flex items-start justify-between gap-2 z-10">
                  <div
                    className={`card-icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${theme.iconBg} border flex items-center justify-center flex-shrink-0 text-2xl sm:text-3xl select-none group-hover:scale-110 transition-transform shadow-inner`}
                  >
                    {cat.iconEmoji || '🧴'}
                  </div>

                  {/* Admin Tools or Badge */}
                  {adminActive ? (
                    <div
                      className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, cat)}
                        className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-700/60 rounded-lg transition-colors cursor-pointer"
                        title="تعديل القسم"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(e, cat)}
                        className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/70 rounded-lg transition-colors cursor-pointer"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      id={`card-badge-${cat.id}`}
                      className={`card-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${theme.badge}`}
                    >
                      {cat.badgeText || (cat.isAvailable !== false ? 'متاح' : 'قريباً')}
                    </span>
                  )}
                </div>

                {/* Middle: Big bold title & optional image & description */}
                <div className="space-y-1.5 mt-3 sm:mt-4 z-10 text-right flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white group-hover:text-pink-100 transition-colors leading-tight line-clamp-2">
                    {cat.title}
                  </h2>

                  {/* Optional Category Image Under Title */}
                  {cat.imageUrl && (
                    <div className="my-2 rounded-2xl overflow-hidden border border-white/15 shadow-md bg-black/30">
                      <img
                        src={cat.imageUrl}
                        alt={cat.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {cat.description ? (
                    <p className="text-[11px] sm:text-xs text-purple-200/90 line-clamp-2 font-medium leading-relaxed">
                      {cat.description}
                    </p>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-purple-300/80 font-medium">
                      منتجات وتركيبات متخصصة
                    </p>
                  )}
                </div>

                {/* Bottom Card Footer Action Button: اضغط للتصفح */}
                <div className="pt-2.5 mt-2.5 border-t border-white/10 card-action-divider z-10 w-full">
                  <button
                    type="button"
                    id={`btn-browse-category-${cat.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(cat);
                    }}
                    className="btn-browse-action w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md active:scale-95 select-none whitespace-nowrap"
                  >
                    <span>اضغط للتصفح</span>
                    <ChevronLeft className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
        existingCount={categories.length}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!categoryToDelete}
        title="حذف القسم"
        itemName={categoryToDelete?.title || ''}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
