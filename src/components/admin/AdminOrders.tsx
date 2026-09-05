import React, { useState, useEffect } from 'react';
import { UserOrder } from '../../types';
import { getAuthToken } from '../../services/storageService';
import { getOrderStatusInfo, formatPriceText } from '../OrdersTab';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  RefreshCw,
  Search,
  Filter,
  User,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const ORDER_STATUS_ACTIONS = [
  {
    key: 'قيد المراجعة',
    dbCode: 'pending',
    label: 'قيد المراجعة',
    icon: '🟡',
    activeClass: 'admin-btn-active-pending bg-yellow-500 text-yellow-950 border-yellow-300 ring-2 ring-yellow-400/50 shadow-md shadow-yellow-950/40 font-black',
    inactiveClass: 'admin-btn-inactive-pending bg-[#1a1405] text-yellow-200/90 border-yellow-700/50 hover:bg-yellow-900/40 hover:text-yellow-100 hover:border-yellow-500'
  },
  {
    key: 'تم التأكيد',
    dbCode: 'confirmed',
    label: 'تم التأكيد',
    icon: '🔵',
    activeClass: 'admin-btn-active-confirmed bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/50 shadow-md shadow-blue-950/40 font-black',
    inactiveClass: 'admin-btn-inactive-confirmed bg-[#06142c] text-blue-200/90 border-blue-700/50 hover:bg-blue-900/40 hover:text-blue-100 hover:border-blue-500'
  },
  {
    key: 'تم التجهيز',
    dbCode: 'preparing',
    label: 'تم التجهيز',
    icon: '🟠',
    activeClass: 'admin-btn-active-preparing bg-amber-600 text-white border-amber-300 ring-2 ring-amber-400/50 shadow-md shadow-amber-950/40 font-black',
    inactiveClass: 'admin-btn-inactive-preparing bg-[#220e03] text-amber-200/90 border-amber-700/50 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-500'
  },
  {
    key: 'تم التسليم',
    dbCode: 'delivered',
    label: 'تم التسليم',
    icon: '🟢',
    activeClass: 'admin-btn-active-delivered bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-950/40 font-black',
    inactiveClass: 'admin-btn-inactive-delivered bg-[#031d10] text-emerald-200/90 border-emerald-700/50 hover:bg-emerald-900/40 hover:text-emerald-100 hover:border-emerald-500'
  },
  {
    key: 'مرفوض',
    dbCode: 'rejected',
    label: 'رفض / إلغاء',
    icon: '🔴',
    activeClass: 'admin-btn-active-rejected bg-rose-600 text-white border-rose-300 ring-2 ring-rose-400/50 shadow-md shadow-rose-950/40 font-black',
    inactiveClass: 'admin-btn-inactive-rejected bg-[#25040d] text-rose-200/90 border-rose-700/50 hover:bg-rose-900/40 hover:text-rose-100 hover:border-rose-500'
  }
];

export function isStatusMatching(currentStatus?: string, targetStatus?: string): boolean {
  if (!currentStatus || !targetStatus) return false;
  const s1 = currentStatus.trim().toLowerCase();
  const s2 = targetStatus.trim().toLowerCase();
  if (s1 === s2) return true;

  const aliases: Record<string, string[]> = {
    'pending': ['pending', 'قيد المراجعة', 'قيد الانتظار'],
    'confirmed': ['confirmed', 'تم التأكيد', 'تم تأكيد الطلب', 'مؤكد'],
    'preparing': ['preparing', 'تم التجهيز', 'جاري التجهيز', 'قيد التجهيز'],
    'delivered': ['delivered', 'تم التسليم', 'مكتمل', 'تم التوصيل'],
    'rejected': ['rejected', 'مرفوض', 'تم الإلغاء', 'ملغي']
  };

  for (const group of Object.values(aliases)) {
    if (group.includes(s1) && group.includes(s2)) {
      return true;
    }
  }
  return false;
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [orderToDeleteAdmin, setOrderToDeleteAdmin] = useState<UserOrder | null>(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState<boolean>(false);
  const [adminDeleteError, setAdminDeleteError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } else {
        // Fallback to /api/orders if needed
        const resFallback = await fetch('/api/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (resFallback.ok) {
          const data = await resFallback.json();
          if (Array.isArray(data)) setOrders(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const isCancellation = newStatus === 'rejected' || newStatus === 'cancelled';
      const cancelledBy = isCancellation ? 'admin' : '';

      // Optimistically update locally
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                cancelledBy,
                cancelledAt: isCancellation ? new Date().toISOString() : ''
              }
            : o
        )
      );

      const token = getAuthToken();
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, cancelledBy })
      });

      if (res.ok) {
        const result = await res.json();
        if (result?.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...result.order } : o))
          );
        }
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdminDeleteOrder = async () => {
    if (!orderToDeleteAdmin || isDeletingAdmin) return;
    setIsDeletingAdmin(true);
    setAdminDeleteError(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/orders/${orderToDeleteAdmin.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'تعذر حذف الطلب من لوحة الأدمن');
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderToDeleteAdmin.id));
      setOrderToDeleteAdmin(null);
    } catch (err: any) {
      setAdminDeleteError(err?.message || 'حدث خطأ أثناء حذف الطلب');
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchQuery ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || isStatusMatching(o.status, statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#2a0d4a] to-[#1c0836] border border-purple-700/60 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-950/60">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>إدارة طلبات العملاء</span>
              <Sparkles className="w-4 h-4 text-pink-400" />
            </h2>
            <span className="text-xs text-pink-200 font-bold">
              إجمالي الطلبات المستلمة: {orders.length} طلب
            </span>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 bg-pink-950/70 hover:bg-pink-900 border border-pink-700/60 rounded-2xl text-xs font-black text-pink-200 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، الهاتف، العنوان أو المنتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b0733] border border-purple-700/60 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500 font-bold shadow-inner"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-[#1b0733] text-purple-300 hover:text-white border-purple-800/60'
            }`}
          >
            جميع الطلبات ({orders.length})
          </button>
          {ORDER_STATUS_ACTIONS.map((action) => {
            const count = orders.filter((o) => isStatusMatching(o.status, action.key)).length;
            const info = getOrderStatusInfo(action.key);
            return (
              <button
                key={action.key}
                onClick={() => setStatusFilter(action.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  statusFilter === action.key
                    ? `${info.badgeClass} ring-2 ring-white/30 shadow-md`
                    : 'bg-[#1b0733] text-purple-300 hover:text-white border-purple-800/60'
                }`}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-12 text-center space-y-3 shadow-lg">
          <ShoppingBag className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">لا توجد طلبات مطابقة</h3>
          <p className="text-xs text-purple-300 max-w-sm mx-auto">
            {searchQuery ? 'جرب البحث برقم هاتف أو اسم آخر.' : 'ستظهر طلبات العملاء فور إنشائها وتأكيدها.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const phoneMatch = order.description?.match(/الهاتف:\s*([0-9+]+)/);
            const nameMatch = order.description?.match(/الاسم:\s*([^\n\r]+)/);
            const addressMatch = order.description?.match(/العنوان:\s*([^\n\r]+)/);

            const phone = order.userPhone || (phoneMatch ? phoneMatch[1] : '');
            const customerName = order.userName || (nameMatch ? nameMatch[1] : '');
            const address = order.userAddress || (addressMatch ? addressMatch[1] : '');

            const statusInfo = getOrderStatusInfo(order.status);
            const quantity = order.quantity || order.itemsCount || 1;
            const unitPrice = order.unitPrice !== undefined && order.unitPrice !== null ? order.unitPrice : order.price;
            const unitPriceDisplay = formatPriceText(unitPrice);
            const totalPriceDisplay = formatPriceText(order.totalPrice || order.price);

            return (
              <div
                key={order.id}
                className="bg-gradient-to-br from-[#230d43] via-[#1e0a3a] to-[#16062b] border border-purple-700/70 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4"
              >
                {/* Header: Order # + Date + Current Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black bg-purple-950 px-3 py-1 rounded-xl text-pink-300 border border-purple-700/60 shadow-inner">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-purple-300 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{order.date}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.cancelledBy === 'user' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border bg-rose-500/20 text-rose-300 border-rose-500/40">
                        <span>🔴</span>
                        <span>تم إلغاء الطلب بواسطة العميل</span>
                      </div>
                    ) : order.cancelledBy === 'admin' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border bg-rose-500/20 text-rose-300 border-rose-500/40">
                        <span>🔴</span>
                        <span>تم إلغاء الطلب بواسطة الإدارة</span>
                      </div>
                    ) : (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusInfo.badgeClass}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Alert Banner if order was cancelled */}
                {order.cancelledBy && (
                  <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-2.5 px-3.5 flex items-center justify-between text-xs text-rose-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-rose-400">⚠️</span>
                      <span>
                        {order.cancelledBy === 'user'
                          ? 'قام العميل بإلغاء هذا الطلب من حسابه الشخصي'
                          : 'تم إلغاء هذا الطلب بواسطة الإدارة'}
                      </span>
                    </div>
                    {order.cancelledAt && (
                      <span className="text-[11px] text-rose-300/80 font-mono">
                        {new Date(order.cancelledAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                )}

                {/* Product Title & Financial Breakdown */}
                <div className="bg-[#18062e] p-3.5 rounded-2xl border border-purple-800/50 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-purple-400 block">المنتج المطلوب:</span>
                      <h3 className="text-sm sm:text-base font-black text-white">{order.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-800/40 text-center">
                    <div>
                      <span className="text-[10px] text-purple-400 font-bold block">الكمية</span>
                      <span className="text-xs sm:text-sm font-black text-white">{quantity}</span>
                    </div>
                    <div className="border-x border-purple-800/40">
                      <span className="text-[10px] text-purple-400 font-bold block">سعر الوحدة</span>
                      <span className="text-xs sm:text-sm font-black text-pink-300">
                        {unitPriceDisplay}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block">الإجمالي:</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400">{totalPriceDisplay}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="bg-[#140426] p-3.5 rounded-2xl border border-purple-800/40 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-pink-300 block">بيانات العميل والتوصيل:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-purple-200">
                    {customerName && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <User className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                        <span className="text-white">الاسم: {customerName}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-white" dir="ltr">{phone}</span>
                      </div>
                    )}
                  </div>

                  {address && (
                    <div className="flex items-start gap-1.5 text-purple-200 font-medium pt-1 border-t border-purple-900/40">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>العنوان: {address}</span>
                    </div>
                  )}

                  {order.userEmail && (
                    <div className="text-[11px] text-purple-300 font-medium">
                      البريد الإلكتروني للحساب: {order.userEmail}
                    </div>
                  )}
                </div>

                {/* Status Action Buttons Section (Admin-Only Direct Buttons) */}
                <div className="bg-[#120322] p-3.5 sm:p-4 rounded-2xl border border-purple-800/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span>تغيير حالة الطلب (لوحة الأدمن):</span>
                    </span>
                    {updatingId === order.id && (
                      <span className="text-[11px] text-pink-300 font-bold flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>جاري حفظ الحالة...</span>
                      </span>
                    )}
                  </div>

                  {/* 5 Ordered Status Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ORDER_STATUS_ACTIONS.map((action) => {
                      const isCurrent = isStatusMatching(order.status, action.key) || isStatusMatching(order.status, action.dbCode);
                      return (
                        <button
                          key={action.key}
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, action.dbCode)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrent ? action.activeClass : action.inactiveClass
                          }`}
                          title={`تغيير الحالة إلى ${action.label}`}
                        >
                          <span>{action.icon}</span>
                          <span className="truncate">{action.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 mr-0.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Row: WhatsApp Direct Message Button & Admin Delete Button */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {phone ? (
                      <button
                        onClick={() => {
                          const cleanPhone = phone.replace(/[^0-9]/g, '');
                          const waNumber = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
                          const currentLabel = getOrderStatusInfo(order.status).label;
                          const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                            `مرحباً ${customerName || 'عزيزي العميل'}، بخصوص طلبك (${order.title}) رقم (${order.orderNumber}) في تطبيق خليكي جميلة:\nحالة الطلب الحالية: ${currentLabel}`
                          )}`;
                          window.open(waUrl, '_blank');
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/50 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>مراسلة العميل عبر واتساب</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-purple-400">لا يوجد رقم هاتف مسجل</div>
                    )}

                    <button
                      type="button"
                      id={`btn-admin-delete-order-${order.id}`}
                      onClick={() => {
                        setAdminDeleteError(null);
                        setOrderToDeleteAdmin(order);
                      }}
                      className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="حذف هذا الطلب نهائياً من قاعدة البيانات"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>حذف الطلب نهائياً</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-purple-400 font-mono">
                    ID: {order.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Order Delete Confirmation Modal */}
      {orderToDeleteAdmin && (
        <div
          id="admin-order-delete-confirm-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingAdmin) setOrderToDeleteAdmin(null);
          }}
        >
          <div
            id="admin-order-delete-modal-content"
            className="bg-[#210a40] border border-rose-700/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl text-right animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-black text-white">
                  حذف الطلب نهائياً (إدارة)
                </h3>
                <p className="text-xs text-purple-300">
                  {orderToDeleteAdmin.orderNumber} - {orderToDeleteAdmin.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed bg-[#17052e] p-3 rounded-2xl border border-purple-800/50">
              هل أنت متأكد كمسؤول من حذف هذا الطلب نهائياً؟ سيتم مسح الطلب من قاعدة البيانات.
            </p>

            {adminDeleteError && (
              <div className="bg-rose-950/80 border border-rose-600/70 text-rose-200 p-3 rounded-2xl flex items-center gap-2 text-xs">
                <span>{adminDeleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                id="btn-admin-confirm-delete-order"
                disabled={isDeletingAdmin}
                onClick={handleAdminDeleteOrder}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeletingAdmin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>نعم، احذف نهائياً</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-admin-delete-cancel"
                disabled={isDeletingAdmin}
                onClick={() => setOrderToDeleteAdmin(null)}
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

