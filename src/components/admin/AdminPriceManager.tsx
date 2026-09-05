import React, { useState } from 'react';
import { ProductFormulation, CategoryItem } from '../../types';
import { DollarSign, Save, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';

interface AdminPriceManagerProps {
  products: ProductFormulation[];
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategoryId: (id: string) => void;
  onUpdatePrice: (id: string, productionCost: number, sellingPrice: number) => void;
}

export const AdminPriceManager: React.FC<AdminPriceManagerProps> = ({
  products,
  categories,
  selectedCategoryId,
  onSelectCategoryId,
  onUpdatePrice
}) => {
  // Local state for table edits
  const [editedPrices, setEditedPrices] = useState<Record<string, { cost: number; price: number }>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => !selectedCategoryId || p.categoryId === selectedCategoryId);

  const getCost = (p: ProductFormulation) =>
    editedPrices[p.id]?.cost !== undefined ? editedPrices[p.id].cost : p.productionCost;

  const getPrice = (p: ProductFormulation) =>
    editedPrices[p.id]?.price !== undefined ? editedPrices[p.id].price : p.sellingPrice;

  const handleCostChange = (id: string, val: number, currPrice: number) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        cost: val,
        price: prev[id]?.price !== undefined ? prev[id].price : currPrice
      }
    }));
  };

  const handlePriceChange = (id: string, val: number, currCost: number) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        cost: prev[id]?.cost !== undefined ? prev[id].cost : currCost,
        price: val
      }
    }));
  };

  const handleSaveItem = (p: ProductFormulation) => {
    const cost = getCost(p);
    const price = getPrice(p);
    onUpdatePrice(p.id, cost, price);
    setSavedSuccessId(p.id);
    setTimeout(() => {
      setSavedSuccessId(null);
    }, 2000);
  };

  const handleSaveAll = () => {
    Object.keys(editedPrices).forEach((id) => {
      const p = products.find((prod) => prod.id === id);
      if (p) {
        onUpdatePrice(id, editedPrices[id].cost, editedPrices[id].price);
      }
    });
    setSavedSuccessId('all');
    setTimeout(() => {
      setSavedSuccessId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header Info */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">إدارة الأسعار وتكاليف الإنتاج الحية</h4>
            <p className="text-[11px] text-purple-300">عدل الأسعار هنا لتنعكس فوراً ومباشرة داخل التطبيق بدون تعديل الكود</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedCategoryId}
            onChange={(e) => onSelectCategoryId(e.target.value)}
            className="bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#180730] text-white">
                {c.title}
              </option>
            ))}
          </select>

          {Object.keys(editedPrices).length > 0 && (
            <button
              onClick={handleSaveAll}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ جميع التعديلات</span>
            </button>
          )}
        </div>
      </div>

      {savedSuccessId === 'all' && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-200 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ وتحديث جميع الأسعار في النظام بنجاح!</span>
        </div>
      )}

      {/* Pricing Table / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-8 text-center space-y-2">
          <p className="text-xs text-purple-200">لا توجد منتجات لتسعيرها في هذا القسم حالياً.</p>
        </div>
      ) : (
        <div className="bg-[#210a40] border border-purple-700/60 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-purple-950/90 text-purple-200 border-b border-purple-800/60">
                <tr>
                  <th className="p-3 font-bold">اسم المنتج / التركيبة</th>
                  <th className="p-3 font-bold text-center">تكلفة التصنيع</th>
                  <th className="p-3 font-bold text-center">سعر البيع المقترح</th>
                  <th className="p-3 font-bold text-center">هامش الربح الحسابي</th>
                  <th className="p-3 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40 text-white">
                {filteredProducts.map((prod) => {
                  const currentCost = getCost(prod);
                  const currentPrice = getPrice(prod);
                  const marginVal =
                    currentCost > 0 && currentPrice > 0
                      ? Math.round(((currentPrice - currentCost) / currentCost) * 100)
                      : 0;
                  const isSaved = savedSuccessId === prod.id;
                  const isModified =
                    editedPrices[prod.id]?.cost !== undefined ||
                    editedPrices[prod.id]?.price !== undefined;

                  return (
                    <tr key={prod.id} className="hover:bg-purple-900/30 transition-colors">
                      <td className="p-3 font-extrabold text-white">
                        <div className="flex flex-col">
                          <span>{prod.name}</span>
                          <span className="text-[10px] text-purple-300 font-medium">{prod.batchSize || '100 لتر'}</span>
                        </div>
                      </td>

                      {/* Cost Input */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#180730] border border-purple-700/60 rounded-xl px-2 py-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={currentCost}
                            onChange={(e) =>
                              handleCostChange(prod.id, parseFloat(e.target.value) || 0, currentPrice)
                            }
                            className="w-16 bg-transparent text-xs font-bold text-white text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-purple-300">{prod.currency || 'ج.م'}</span>
                        </div>
                      </td>

                      {/* Selling Price Input */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#180730] border border-emerald-500/50 rounded-xl px-2 py-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={currentPrice}
                            onChange={(e) =>
                              handlePriceChange(prod.id, parseFloat(e.target.value) || 0, currentCost)
                            }
                            className="w-16 bg-transparent text-xs font-bold text-emerald-300 text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-purple-300">{prod.currency || 'ج.م'}</span>
                        </div>
                      </td>

                      {/* Calculated Margin */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            marginVal >= 100
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : marginVal >= 50
                              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          +{marginVal}%
                        </span>
                      </td>

                      {/* Save Button */}
                      <td className="p-3 text-center">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم الحفظ</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSaveItem(prod)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              isModified
                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                                : 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200'
                            }`}
                          >
                            <Save className="w-3 h-3" />
                            <span>حفظ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
