import React, { useState } from 'react';
import {
  ShoppingBag,
  Calendar,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { UserOrder } from '../types';
import { cancelUserOrder, deleteUserOrder } from '../services/storageService';

interface OrdersTabProps {
  orders: UserOrder[];
  onAddNewInquiry?: () => void;
  selectedOrderId?: string;
  onOrderCancelled?: (updatedOrder: UserOrder) => void;
}

export function formatPriceText(val?: string | number | null, currency: string = 'جنيه'): string {
  if (val === undefined || val === null || val === '') return `0 ${currency}`;
  if (typeof val === 'number') return `${val} ${currency}`;
  const clean = String(val).replace(new RegExp(currency, 'gi'), '').trim();
  return clean ? `${clean} ${currency}` : `0 ${currency}`;
}

export function isOrderCancellableByCustomer(order: UserOrder): boolean {
  if (order.cancelledBy) return false;
  const s = (order.status || '').trim().toLowerCase();
  // Customer can strictly ONLY cancel when the status is pending (قيد المراجعة)
  // If the Admin confirms the order, the button disappears immediately
  return (
    s === 'pending' ||
    s === 'قيد المراجعة' ||
    s === 'قيد الانتظار' ||
    s === 'جديد'
  );
}

export function getOrderStatusInfo(status?: string, cancelledBy?: string) {
  const clean = (status || '').trim().toLowerCase();

  // If status is cancelled or cancelledBy is recorded
  if (
    clean === 'ملغي' ||
    clean === 'cancelled' ||
    clean === 'canceled' ||
    clean === 'تم الإلغاء' ||
    clean === 'rejected' ||
    clean === 'مرفوض' ||
    cancelledBy
  ) {
    let label = 'ملغي';
    if (cancelledBy === 'user') {
      label = 'ملغي بواسطة العميل';
    } else if (cancelledBy === 'admin') {
      label = 'ملغي بواسطة الإدارة';
    } else if (clean === 'rejected' || clean === 'مرفوض') {
      label = 'مرفوض';
    }

    return {
      label,
      dbCode: 'cancelled',
      icon: '🔴',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotClass: 'bg-rose-400'
    };
  }

  switch (clean) {
    case 'تم التأكيد':
    case 'تم تأكيد الطلب':
    case 'confirmed':
      return {
        label: 'تم التأكيد',
        dbCode: 'confirmed',
        icon: '🔵',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        dotClass: 'bg-blue-400'
      };
    case 'تم التجهيز':
    case 'جاري التجهيز':
    case 'قيد التجهيز':
    case 'preparing':
      return {
        label: 'جاري التجهيز',
        dbCode: 'preparing',
        icon: '🟠',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotClass: 'bg-amber-400'
      };
    case 'تم التسليم':
    case 'مكتمل':
    case 'delivered':
      return {
        label: 'تم التسليم',
        dbCode: 'delivered',
        icon: '🟢',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dotClass: 'bg-emerald-400'
      };
    case 'قيد المراجعة':
    case 'pending':
    default:
      return {
        label: 'قيد المراجعة',
        dbCode: 'pending',
        icon: '🟡',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        dotClass: 'bg-yellow-400'
      };
  }
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders: initialOrders, selectedOrderId, onOrderCancelled }) => {
  const [localOrders, setLocalOrders] = useState<UserOrder[]>(initialOrders);
  const [orderToCancel, setOrderToCancel] = useState<UserOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<UserOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Keep localOrders in sync with prop updates
  React.useEffect(() => {
    setLocalOrders(initialOrders);
  }, [initialOrders]);

  const handleConfirmCancel = async () => {
    if (!orderToCancel || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await cancelUserOrder(orderToCancel.id);
      if (res.success) {
        const updatedOrder: UserOrder = res.order || {
          ...orderToCancel,
          status: 'cancelled',
          cancelledBy: 'user',
          cancelledAt: new Date().toISOString()
        };

        setLocalOrders((prev) =>
          prev.map((o) => (o.id === orderToCancel.id ? updatedOrder : o))
        );

        if (onOrderCancelled) {
          onOrderCancelled(updatedOrder);
        }

        setOrderToCancel(null);
        setSuccessToast(`تم إلغاء الطلب ${orderToCancel.orderNumber} بنجاح`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setCancelError(res.error || 'تعذر إلغاء الطلب، يرجى المحاولة لاحقاً');
      }
    } catch (err: any) {
      setCancelError(err?.message || 'حدث خطأ غير متوقع أثناء إلغاء الطلب');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteUserOrder(orderToDelete.id);
      if (res.success) {
        setLocalOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
        setOrderToDelete(null);
        setSuccessToast(`تم حذف الطلب ${orderToDelete.orderNumber} بنجاح`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setDeleteError(res.error || 'تعذر حذف الطلب، يرجى المحاولة لاحقاً');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'حدث خطأ غير متوقع أثناء حذف الطلب');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="orders-tab-content" className="space-y-4 pb-20 pt-2 animate-in fade-in duration-200" dir="rtl">
      {/* Success Notification Banner */}
      {successToast && (
        <div
          id="order-cancel-toast"
          className="bg-emerald-950/90 border border-emerald-600/70 text-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-900/60 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {localOrders.length === 0 ? (
        /* Empty State */
        <div
          id="orders-empty-state"
          className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-lg shadow-purple-950/60"
        >
          <div className="w-16 h-16 bg-pink-900/40 text-pink-300 rounded-2xl flex items-center justify-center mx-auto border border-pink-700/50">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">
              لا توجد طلبات حتى الآن
            </h2>
            <p className="text-xs text-purple-300 max-w-xs mx-auto">
              عندما تقوم بطلب أي منتج أو خامات من خلال زر «اطلب الآن» ستظهر تفاصيل طلباتك هنا مباشرة.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              <span>طلباتي السابقة</span>
            </h2>
            <span className="text-xs text-pink-200 font-bold bg-pink-950/70 px-3 py-1 rounded-xl border border-pink-700/50">
              {localOrders.length} طلب
            </span>
          </div>

          {localOrders.map((order) => {
            const isSelected = !!selectedOrderId && (order.id === selectedOrderId || order.orderNumber === selectedOrderId || order.orderNumber === `#${selectedOrderId}`);
            const statusInfo = getOrderStatusInfo(order.status, order.cancelledBy);
            const quantity = order.quantity || order.itemsCount || 1;
            const unitPrice = order.unitPrice !== undefined && order.unitPrice !== null ? order.unitPrice : order.price;
            const unitPriceDisplay = formatPriceText(unitPrice);
            const totalPriceDisplay = formatPriceText(order.totalPrice || order.price);
            const canCancel = isOrderCancellableByCustomer(order);

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className={`order-card-container bg-gradient-to-br from-[#230d43] via-[#1f0b3b] to-[#17062d] border rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 text-right transition-all ${
                  isSelected
                    ? 'border-pink-500 ring-2 ring-pink-500/80 shadow-pink-500/20'
                    : 'border-purple-700/60 hover:border-pink-500/50'
                }`}
              >
                {/* Header: Order Number + Status Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-purple-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="order-number-badge text-xs font-mono font-black bg-purple-950/90 text-pink-300 px-2.5 py-1 rounded-xl border border-purple-700/60">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-purple-300 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{order.date}</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`order-status-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusInfo.badgeClass}`}
                  >
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </div>
                </div>

                {/* Product Name & Description */}
                <div className="space-y-1">
                  <h3 className="order-title text-base sm:text-lg font-black text-white leading-snug">
                    {order.title}
                  </h3>
                  {order.description && (
                    <p className="order-description-box text-xs text-purple-200/90 bg-[#16052b] p-2.5 rounded-2xl border border-purple-800/40 font-medium leading-relaxed">
                      {order.description}
                    </p>
                  )}
                </div>

                {/* Detailed Grid: Quantity, Unit Price, Total Price */}
                <div className="order-price-grid grid grid-cols-3 gap-2 bg-[#17052e] p-3 rounded-2xl border border-purple-800/50 text-center">
                  {/* Quantity */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-purple-400 font-bold block">الكمية</span>
                    <span className="text-xs sm:text-sm font-black text-white">{quantity}</span>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-0.5 border-x border-purple-800/50 px-1">
                    <span className="text-[10px] text-purple-400 font-bold block">سعر الوحدة</span>
                    <span className="text-xs sm:text-sm font-black text-pink-300">
                      {unitPriceDisplay}
                    </span>
                  </div>

                  {/* Total Price */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold block">الإجمالي:</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-400">
                      {totalPriceDisplay}
                    </span>
                  </div>
                </div>

                {/* Order Actions: Delete and (if eligible) Cancel */}
                <div className="pt-2 border-t border-purple-800/40 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    id={`btn-delete-order-${order.id}`}
                    onClick={() => {
                      setDeleteError(null);
                      setOrderToDelete(order);
                    }}
                    className="btn-delete-order min-h-[40px] py-2 px-3 rounded-2xl bg-purple-950/40 hover:bg-rose-950/60 text-purple-300 hover:text-rose-300 border border-purple-800/50 hover:border-rose-800/50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="حذف هذا الطلب من قائمتك"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>حذف الطلب</span>
                  </button>

                  {canCancel && (
                    <button
                      type="button"
                      id={`btn-cancel-order-${order.id}`}
                      onClick={() => {
                        setCancelError(null);
                        setOrderToCancel(order);
                      }}
                      className="btn-cancel-order min-h-[40px] py-2 px-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 active:bg-rose-950 text-rose-300 hover:text-rose-100 border border-rose-700/60 font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                    >
                      <X className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>❌ إلغاء الطلب</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal Before Cancellation */}
      {orderToCancel && (
        <div
          id="order-cancel-confirm-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isCancelling) setOrderToCancel(null);
          }}
        >
          <div
            id="order-cancel-modal-content"
            className="order-cancel-modal-container bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl text-right animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header with Alert Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-black text-white">
                  هل أنت متأكد من إلغاء الطلب؟
                </h3>
                <p className="text-xs text-purple-300">
                  {orderToCancel.orderNumber} - {orderToCancel.title}
                </p>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-2xl text-xs text-rose-200 font-medium leading-relaxed">
              عند تأكيد الإلغاء، ستتغير حالة الطلب إلى «ملغي» نهائياً ولن تتمكن من تعديلها مرة أخرى.
            </div>

            {/* Error Message if any */}
            {cancelError && (
              <div className="bg-rose-900/60 border border-rose-600 p-2.5 rounded-xl text-xs text-white font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                id="btn-confirm-cancel-order"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="btn-confirm-cancel w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>جاري الإلغاء...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 shrink-0" />
                    <span>إلغاء الطلب</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-cancel-modal-back"
                disabled={isCancelling}
                onClick={() => setOrderToCancel(null)}
                className="btn-modal-back w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 hover:text-white border border-purple-700/50 font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <span>رجوع</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Deleting Order */}
      {orderToDelete && (
        <div
          id="order-delete-confirm-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setOrderToDelete(null);
          }}
        >
          <div
            id="order-delete-modal-content"
            className="bg-[#210a40] border border-rose-700/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl text-right animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-black text-white">
                  حذف الطلب من قائمتك
                </h3>
                <p className="text-xs text-purple-300">
                  {orderToDelete.orderNumber} - {orderToDelete.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed bg-[#17052e] p-3 rounded-2xl border border-purple-800/50">
              هل أنت متأكد من رغبتك في حذف هذا الطلب نهائيًا من قائمة طلباتك؟
            </p>

            {deleteError && (
              <div className="bg-rose-950/80 border border-rose-600/70 text-rose-200 p-3 rounded-2xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                id="btn-confirm-delete-order"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>نعم، احذف</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-delete-modal-back"
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 hover:text-white border border-purple-700/50 font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



