import React, { useState, useEffect } from 'react';
import { ProductFormulation, CategoryItem, IngredientItem } from '../../types';
import { X, Beaker, Plus, Trash2, Save, DollarSign, ListOrdered, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import { PriceDisplay } from '../PriceDisplay';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: ProductFormulation | null;
  initialProduct?: ProductFormulation | null;
  categories?: CategoryItem[];
  defaultCategoryId?: string;
  categoryId?: string;
  defaultOrder?: number;
  onClose: () => void;
  onSave: (product: ProductFormulation) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  initialProduct,
  defaultCategoryId = 'detergents',
  categoryId,
  defaultOrder = 1,
  onClose,
  onSave
}) => {
  const activeProduct = initialProduct !== undefined ? initialProduct : product;
  const activeCatId = categoryId || defaultCategoryId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productionCost, setProductionCost] = useState<number | string>('');
  const [sellingPrice, setSellingPrice] = useState<number | string>('');
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [specialOfferText, setSpecialOfferText] = useState('✕ عرض خاص');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [steps, setSteps] = useState<string[]>(['']);

  useEffect(() => {
    if (activeProduct) {
      setName(activeProduct.name || '');
      setDescription(activeProduct.description || '');
      setProductionCost(activeProduct.productionCost ?? '');
      setSellingPrice(activeProduct.sellingPrice ?? '');
      setIsSpecialOffer(!!activeProduct.isSpecialOffer);
      setSpecialOfferText(activeProduct.specialOfferText || '✕ عرض خاص');
      setIngredients(activeProduct.ingredients ? [...activeProduct.ingredients] : []);
      setSteps(activeProduct.steps && activeProduct.steps.length > 0 ? [...activeProduct.steps] : ['']);
    } else {
      setName('');
      setDescription('');
      setProductionCost('');
      setSellingPrice('');
      setIsSpecialOffer(false);
      setSpecialOfferText('✕ عرض خاص');
      setIngredients([]);
      setSteps(['']);
    }
  }, [activeProduct, isOpen]);

  if (!isOpen) return null;

  // Margin calculation
  const costNum = Number(productionCost) || 0;
  const priceNum = Number(sellingPrice) || 0;
  const profitMarginVal = costNum > 0 && priceNum > 0 ? Math.round(((priceNum - costNum) / costNum) * 100) : 0;

  // Ingredients handlers
  const handleAddIngredient = () => {
    const newIng: IngredientItem = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      quantity: '',
      unit: 'كجم'
    };
    setIngredients((prev) => [...prev, newIng]);
  };

  const handleUpdateIngredient = (index: number, field: keyof IngredientItem, value: string) => {
    setIngredients((prev) => {
      const list = [...prev];
      if (list[index]) {
        list[index] = { ...list[index], [field]: value };
      }
      return list;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Steps handlers
  const handleAddStep = () => {
    setSteps((prev) => [...prev, '']);
  };

  const handleUpdateStep = (index: number, value: string) => {
    setSteps((prev) => {
      const list = [...prev];
      list[index] = value;
      return list;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return list;
    });
  };

  const handleMoveStepDown = (index: number) => {
    if (index >= steps.length - 1) return;
    setSteps((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      return list;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: ProductFormulation = {
      id: activeProduct?.id || `prod-${Date.now()}`,
      categoryId: activeCatId,
      name: name.trim(),
      description: description.trim(),
      difficulty: activeProduct?.difficulty || 'سهل',
      productionCost: Number(productionCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      profitMargin: profitMarginVal > 0 ? `${profitMarginVal}%` : 'مجزٍ',
      currency: activeProduct?.currency || 'ج.م',
      isSpecialOffer: isSpecialOffer,
      specialOfferText: specialOfferText.trim() || '✕ عرض خاص',
      batchSize: activeProduct?.batchSize || '100 لتر',
      targetPh: activeProduct?.targetPh || '',
      mixingTime: activeProduct?.mixingTime || '',
      ingredients: ingredients.filter((i) => i.name.trim().length > 0),
      steps: steps.filter((s) => s.trim().length > 0),
      notesAndWarnings: activeProduct?.notesAndWarnings || [],
      isVisible: true,
      order: activeProduct?.order || defaultOrder || 1,
      createdAt: activeProduct?.createdAt || new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Beaker className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {activeProduct ? 'تعديل التركيبة' : 'إضافة تركيبة جديدة'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">اسم المنتج *</label>
            <input
              type="text"
              required
              placeholder="مثال: صابون سائل عالي الرغوة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-purple-200">وصف مختصر</label>
            <textarea
              rows={2}
              placeholder="اكتب وصفاً أو ملاحظة مختصرة عن المنتج وطريقة الاستخدام..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {/* Pricing Grid */}
          <div className="space-y-2.5 bg-[#180730] p-3 rounded-2xl border border-purple-800/40">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                  <span>تكلفة التصنيع</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={productionCost}
                  onChange={(e) => setProductionCost(e.target.value)}
                  className="w-full bg-purple-950/60 border border-purple-700/60 rounded-xl px-3 py-2 text-xs font-bold text-white text-center focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سعر البيع</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-purple-950/60 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 text-center focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Special Offer Toggle */}
            <div className="pt-2 border-t border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="product-special-offer-toggle"
                  className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer select-none"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>تفعيل بادج «✕ عرض خاص»</span>
                </label>
                <input
                  id="product-special-offer-toggle"
                  type="checkbox"
                  checked={isSpecialOffer}
                  onChange={(e) => setIsSpecialOffer(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isSpecialOffer && (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="نص البادج (افتراضي: ✕ عرض خاص)"
                    value={specialOfferText}
                    onChange={(e) => setSpecialOfferText(e.target.value)}
                    className="w-full bg-[#120422] border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <div className="bg-[#120422]/90 p-2 rounded-xl border border-purple-800/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-purple-300 font-medium">معاينة السعر:</span>
                    <PriceDisplay
                      price={sellingPrice || 150}
                      currency={activeProduct?.currency || 'جنيه'}
                      isSpecialOffer={true}
                      specialOfferText={specialOfferText || '✕ عرض خاص'}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw Materials & Ingredients */}
          <div className="space-y-2 pt-1 border-t border-purple-800/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5 text-purple-400" />
                <span>المكونات والكميات</span>
              </label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-200 bg-purple-900/80 hover:bg-purple-800 border border-purple-700/60 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مادة</span>
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="bg-[#180730]/50 border border-dashed border-purple-800/50 rounded-xl p-3 text-center text-xs text-purple-300">
                اضغط على "إضافة مادة" لإدراج المكونات والكميات (اختياري)
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={ing.id || idx} className="flex items-center gap-2 bg-[#180730] p-2 rounded-xl border border-purple-800/40">
                    <input
                      type="text"
                      placeholder="اسم المادة (مثال: سلفونيك)"
                      value={ing.name}
                      onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-purple-400/40 focus:outline-none font-semibold px-1"
                    />
                    <input
                      type="text"
                      placeholder="الكمية"
                      value={ing.quantity}
                      onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                      className="w-20 bg-purple-950/60 border border-purple-700/40 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1 text-purple-400 hover:text-rose-300 rounded-md transition-colors cursor-pointer"
                      title="حذف المكون"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manufacturing Steps */}
          <div className="space-y-2 pt-1 border-t border-purple-800/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
                <span>خطوات التصنيع</span>
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-200 bg-purple-900/80 hover:bg-purple-800 border border-purple-700/60 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خطوة</span>
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-[#180730] p-2 rounded-xl border border-purple-800/40">
                  <span className="w-6 h-6 rounded-full bg-purple-900/80 text-purple-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    placeholder={`شرح الخطوة رقم ${idx + 1}...`}
                    value={step}
                    onChange={(e) => handleUpdateStep(idx, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white placeholder-purple-400/40 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStepUp(idx)}
                      className={`p-0.5 rounded transition-colors ${
                        idx === 0 ? 'text-purple-700/40 cursor-not-allowed' : 'text-purple-400 hover:text-white cursor-pointer hover:bg-purple-800/50'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === steps.length - 1}
                      onClick={() => handleMoveStepDown(idx)}
                      className={`p-0.5 rounded transition-colors ${
                        idx === steps.length - 1 ? 'text-purple-700/40 cursor-not-allowed' : 'text-purple-400 hover:text-white cursor-pointer hover:bg-purple-800/50'
                      }`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-0.5 text-purple-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-purple-800/50">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                name.trim()
                  ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-purple-900/50'
                  : 'bg-purple-900/30 text-purple-500 cursor-not-allowed border border-purple-800/30'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>حفظ التركيبة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
