import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  CheckCheck,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Video,
  XCircle,
  Truck,
  Trash2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { AppNotification, NotificationType } from '../types';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  isPushSupported,
  getPushPermission,
  requestAndSubscribePush
} from '../services/notificationService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onNavigateToTab?: (tab: 'home' | 'projects' | 'orders' | 'profile') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onNavigateToTab
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'content'>('all');
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'orders') return n.type === 'order_status';
    if (activeFilter === 'content') return n.type === 'new_video' || n.type === 'new_category';
    return true;
  });

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }

    if (notif.type === 'order_status') {
      onClose();
      if (onNavigateToTab) {
        onNavigateToTab('orders');
      }
    } else if (notif.type === 'new_video' || notif.type === 'new_category') {
      onClose();
      if (onNavigateToTab) {
        onNavigateToTab('home');
      }
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllNotificationsAsRead();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    setIsClearing(true);
    await clearAllNotifications();
    setIsClearing(false);
    setShowClearConfirm(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationIcon = (notif: AppNotification) => {
    if (notif.type === 'order_status') {
      const status = notif.statusKey;
      if (status === 'confirmed') {
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      }
      if (status === 'preparing') {
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        );
      }
      if (status === 'delivered') {
        return (
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        );
      }
      if (status === 'rejected') {
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        );
      }
      return (
        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      );
    }

    if (notif.type === 'new_video') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
          <Video className="w-5 h-5" />
        </div>
      );
    }

    if (notif.type === 'new_category') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <div
        id="notifications-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          id="notifications-modal-container"
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#18082e] border border-purple-800/60 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-right"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-purple-800/40 flex items-center justify-between bg-[#150628]/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-pink-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">الإشعارات</h2>
                  {unreadCount > 0 && (
                    <span className="bg-pink-600/90 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                      {unreadCount} جديدة
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-300">
                  تحديثات فورية لطلباتك والجديد في خليكي جميلة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {notifications.length > 0 && (
                <button
                  id="notifications-clear-all-btn"
                  type="button"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-rose-800/40 transition-all cursor-pointer disabled:opacity-50"
                  title="مسح جميع الإشعارات"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">مسح الإشعارات</span>
                </button>
              )}

              {unreadCount > 0 && (
                <button
                  id="notifications-mark-all-read-btn"
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-purple-700/30 transition-all cursor-pointer"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden sm:inline">قراءة الكل</span>
                </button>
              )}

              <button
                id="notifications-close-btn"
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 hover:text-white flex items-center justify-center border border-purple-700/30 transition-all cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clear Notifications Confirmation Banner */}
          {showClearConfirm && (
            <div className="p-3 bg-rose-950/90 border-b border-rose-800/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-200 text-xs font-bold text-center sm:text-right">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>هل أنت متأكد من مسح جميع الإشعارات من حسابك؟</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-confirm-clear-notifications"
                  type="button"
                  onClick={confirmClearAll}
                  disabled={isClearing}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {isClearing ? 'جاري المسح...' : 'نعم، امسح الكل'}
                </button>
                <button
                  id="btn-cancel-clear-notifications"
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition-all cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className="px-4 py-2.5 bg-[#140626]/50 border-b border-purple-800/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                  : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'orders'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                  : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              الطلبات ({notifications.filter((n) => n.type === 'order_status').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('content')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'content'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                  : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              الجديد ({notifications.filter((n) => n.type === 'new_video' || n.type === 'new_category').length})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {filteredNotifications.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-purple-300 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-purple-900/30 border border-purple-800/50 flex items-center justify-center text-purple-400">
                  <Bell className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">لا توجد إشعارات حالياً</h3>
                  <p className="text-xs text-purple-400 max-w-xs leading-relaxed">
                    ستظهر هنا تنبيهات فورية عند تحديث حالة طلباتك أو إضافة فيديوهات وأقسام جديدة.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif.id}
                    id={`notification-card-${notif.id}`}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isUnread
                        ? 'bg-[#220d3f] border-pink-500/50 shadow-md shadow-pink-950/30 ring-1 ring-pink-500/20'
                        : 'bg-[#1a0832]/60 hover:bg-[#200c3b] border-purple-800/40'
                    }`}
                  >
                    {/* Icon */}
                    {getNotificationIcon(notif)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 animate-pulse" />
                          )}
                          <h4
                            className={`text-xs sm:text-sm font-extrabold truncate ${
                              isUnread ? 'text-white' : 'text-purple-200'
                            }`}
                          >
                            {notif.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-purple-400 shrink-0 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-purple-300 font-medium leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action hint */}
                      <div className="pt-1 flex items-center justify-between text-[11px] text-pink-400 font-semibold">
                        <span className="flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                          {notif.type === 'order_status' ? 'عرض تفاصيل الطلب' : 'تصفح الآن'}
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-rose-400 p-1 rounded-lg transition-all"
                          title="حذف الإشعار"
                          aria-label="حذف الإشعار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#150628] border-t border-purple-800/40 text-center">
            <button
              id="notifications-done-btn"
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer border border-purple-700/40"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
