import React from 'react';
import { ArrowRight, Bell, Sparkles, Share2, HelpCircle, Shield, ShieldCheck, Settings } from 'lucide-react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onHelpClick?: () => void;
  onShareClick?: () => void;
  isAdmin?: boolean;
  onToggleAdminMode?: () => void;
  onOpenAdminDashboard?: () => void;
  unreadNotificationsCount?: number;
  onNotificationsClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = React.memo(({
  title = 'خليكي جميلة',
  subtitle,
  showBack = false,
  onBack,
  onHelpClick,
  onShareClick,
  isAdmin = false,
  onToggleAdminMode,
  onOpenAdminDashboard,
  unreadNotificationsCount = 0,
  onNotificationsClick
}) => {
  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 bg-[#1e0a38]/95 backdrop-blur-md border-b border-purple-800/60 px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Right side: Back button or Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack && onBack ? (
            <button
              id="top-back-button"
              onClick={onBack}
              className="p-2 -mr-1.5 rounded-full hover:bg-purple-800/60 active:bg-purple-700/60 text-purple-200 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              aria-label="الرجوع"
            >
              <ArrowRight className="w-5 h-5 text-purple-100" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/50 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-100" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="text-[11px] text-purple-300 font-medium truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Left side actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && onToggleAdminMode && (
            <button
              id="top-admin-toggle-btn"
              onClick={onToggleAdminMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer bg-purple-900/80 text-purple-200 border border-purple-700/60 hover:bg-purple-800"
              title="لوحة تحكم المدير"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>لوحة التحكم</span>
            </button>
          )}

          {onShareClick && (
            <button
              id="top-share-button"
              onClick={onShareClick}
              className="p-2 rounded-full hover:bg-purple-800/60 text-purple-300 hover:text-white transition-colors cursor-pointer"
              title="مشاركة التطبيق"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {onHelpClick && (
            <button
              id="top-help-button"
              onClick={onHelpClick}
              className="p-2 rounded-full hover:bg-purple-800/60 text-purple-300 hover:text-white transition-colors cursor-pointer"
              title="إرشادات الاستخدام"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <button
              id="top-notifications-button"
              type="button"
              onClick={onNotificationsClick}
              className="p-2 rounded-full hover:bg-purple-800/60 text-purple-300 hover:text-white transition-colors relative cursor-pointer"
              aria-label="الإشعارات"
              title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} إشعارات جديدة` : 'الإشعارات'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-pink-600 text-white font-black text-[10px] rounded-full flex items-center justify-center ring-2 ring-[#1e0a38] animate-pulse">
                  {unreadNotificationsCount > 99 ? '+99' : unreadNotificationsCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
