import React, { useState } from 'react';
import { ProductFormulation, CategoryItem } from '../../types';
import { Beaker, Edit, Trash2, Eye, EyeOff, DollarSign, ListOrdered, ShieldAlert, Sparkles } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface AdminProductsProps {
  products: ProductFormulation[];
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategoryId: (id: string) => void;
  onSaveProduct: (product: ProductFormulation) => void;
  onDeleteProduct: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  selectedCategoryId,
  onSelectCategoryId,
  onSaveProduct,
  onDeleteProduct,
  onToggleVisibility
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormulation | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductFormulation | null>(null);
  const [viewProductDetails, setViewProductDetails] = useState<ProductFormulation | null>(null);

  const filteredProducts = products.filter((p) => !selectedCategoryId || p.categoryId === selectedCategoryId);

  const handleOpenEdit = (p: ProductFormulation) => {
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Filter Bar */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-purple-200 whitespace-nowrap">عرض قسم:</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => onSelectCategoryId(e.target.value)}
            className="w-full sm:w-48 bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#180730] text-white">
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid / List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/70 text-purple-300 flex items-center justify-center mx-auto border border-purple-700/50">
            <Beaker className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-white">لا توجد تركيبات أو منتجات في هذا القسم حتى الآن</h4>
          <p className="text-xs text-purple-200">لا توجد عناصر لعرضها في هذا القسم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className={`bg-[#210a40] border rounded-2xl p-4 sm:p-5 transition-all duration-150 space-y-3 ${
                prod.isVisible !== false
                  ? 'border-purple-700/60 hover:border-purple-500 shadow-md'
                  : 'border-purple-900/60 opacity-60 bg-purple-950/40'
              }`}
            >
              {/* Header Line */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-600/50 flex items-center justify-center text-purple-300 flex-shrink-0">
                    <Beaker className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-white">{prod.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/70 text-purple-200 border border-purple-700/50">
                        {prod.difficulty || 'سهل'}
                      </span>
                      {prod.isVisible !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          مرئي
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          مخفي
                        </span>
                      )}
                    </div>
                    {prod.description && (
                      <p className="text-xs text-purple-200 line-clamp-1 mt-0.5 font-medium">{prod.description}</p>
                    )}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onToggleVisibility(prod.id)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      prod.isVisible !== false
                        ? 'text-purple-300 hover:text-white bg-purple-900/50 border-purple-700/40'
                        : 'text-amber-300 bg-amber-950/40 border-amber-700/40'
                    }`}
                    title={prod.isVisible !== false ? 'إخفاء المنتج' : 'إظهار المنتج'}
                  >
                    {prod.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 text-purple-200 hover:text-white bg-purple-800/50 hover:bg-purple-700/60 border border-purple-600/50 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="تعديل التركيبة"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>

                  <button
                    onClick={() => setDeletingProduct(prod)}
                    className="p-2 text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="حذف المنتج"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price & Cost Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-800/40 text-xs">
                <div className="bg-[#180730] p-2 rounded-xl border border-purple-800/40 flex flex-col">
                  <span className="text-[10px] text-purple-300 font-medium">تكلفة التصنيع</span>
                  <span className="font-extrabold text-white mt-0.5">{prod.productionCost} {prod.currency || 'ج.م'}</span>
                </div>

                <div className="bg-[#180730] p-2 rounded-xl border border-purple-800/40 flex flex-col">
                  <span className="text-[10px] text-purple-300 font-medium">سعر البيع المقترح</span>
                  <span className="font-extrabold text-emerald-300 mt-0.5">{prod.sellingPrice} {prod.currency || 'ج.م'}</span>
                </div>

                <div className="bg-[#180730] p-2 rounded-xl border border-purple-800/40 flex flex-col">
                  <span className="text-[10px] text-purple-300 font-medium">هامش الربح</span>
                  <span className="font-extrabold text-emerald-400 mt-0.5">{prod.profitMargin || 'مجزٍ'}</span>
                </div>

                <div className="bg-[#180730] p-2 rounded-xl border border-purple-800/40 flex flex-col">
                  <span className="text-[10px] text-purple-300 font-medium">المواد والخطوات</span>
                  <span className="font-bold text-purple-200 mt-0.5">
                    {prod.ingredients?.length || 0} خامات • {prod.steps?.length || 0} خطوات
                  </span>
                </div>
              </div>

              {/* Quick Details Trigger */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setViewProductDetails(prod)}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>عرض التفاصيل الكاملة والمكونات</span>
                  <span>←</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        title="حذف المنتج والتركيبة"
        itemName={deletingProduct?.name || ''}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            onDeleteProduct(deletingProduct.id);
          }
        }}
      />

      {/* Detailed Overview Modal */}
      {viewProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-900/80 text-purple-300">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{viewProductDetails.name}</h3>
                  <span className="text-[11px] text-purple-300">{viewProductDetails.batchSize || 'تشغيلة نموذجية'}</span>
                </div>
              </div>
              <button
                onClick={() => setViewProductDetails(null)}
                className="text-xs font-bold text-purple-300 hover:text-white bg-purple-900/60 px-3 py-1.5 rounded-xl"
              >
                إغلاق
              </button>
            </div>

            {/* Ingredients Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-purple-200">🧪 المواد الخام والمكونات:</h5>
              <div className="bg-[#180730] rounded-xl border border-purple-800/50 overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-purple-950/80 text-purple-300 border-b border-purple-800/50">
                    <tr>
                      <th className="p-2 font-bold">المادة الخام</th>
                      <th className="p-2 font-bold text-center">الكمية</th>
                      <th className="p-2 font-bold">الدور / الملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/40 text-purple-100">
                    {viewProductDetails.ingredients?.map((ing, i) => (
                      <tr key={i}>
                        <td className="p-2 font-semibold text-white">{ing.name}</td>
                        <td className="p-2 text-center font-bold text-purple-200">{ing.quantity} {ing.unit}</td>
                        <td className="p-2 text-purple-300">{ing.role || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-purple-200">📋 خطوات التصنيع بالتفصيل:</h5>
              <div className="space-y-2">
                {viewProductDetails.steps?.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#180730] p-2.5 rounded-xl border border-purple-800/40 text-xs text-purple-100 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-purple-800 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {viewProductDetails.notesAndWarnings && viewProductDetails.notesAndWarnings.length > 0 && (
              <div className="space-y-1.5 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>تحذيرات وملاحظات الأمان:</span>
                </h5>
                <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
                  {viewProductDetails.notesAndWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
