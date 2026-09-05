import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Sparkles,
  Moon,
  Sun,
  Bell,
  Info,
  Lock,
  Check,
  Smartphone,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { getCurrentUser, logoutUser, AUTH_STATE_CHANGED_EVENT, AuthUser } from '../services/storageService';
import {
  getSavedTheme,
  setAppTheme,
  THEME_CHANGED_EVENT,
  AppTheme,
  getSavedNotificationsEnabled,
  setSavedNotificationsEnabled
} from '../services/themeService';
import {
  requestAndSubscribePush,
  updatePushPreferencesOnServer
} from '../services/notificationService';

interface ProfileTabProps {
  onReopenSplash?: () => void;
  savedCount?: number;
  onOpenAdminDashboard?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onOpenAdminDashboard }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());
  const [theme, setTheme] = useState<AppTheme>(getSavedTheme());
  const [notifications, setNotifications] = useState<boolean>(getSavedNotificationsEnabled());

  // Modal / Expansion states
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppTheme>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChange);
    };
  }, []);

  const handleThemeToggle = (newTheme: AppTheme) => {
    setTheme(newTheme);
    setAppTheme(newTheme);
  };

  const handleNotificationsToggle = async () => {
    const nextVal = !notifications;
    setNotifications(nextVal);
    setSavedNotificationsEnabled(nextVal);
    updatePushPreferencesOnServer(nextVal);
    if (nextVal) {
      await requestAndSubscribePush();
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logoutUser();
  };

  return (
    <div id="settings-tab-content" className="space-y-4 pb-28 pt-2 animate-in fade-in duration-200" dir="rtl">
      
      {/* 1) حسابي (My Account Card) */}
      <section
        id="settings-account-section"
        aria-label="حسابي"
        className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-5 shadow-lg shadow-purple-950/60 text-right space-y-4 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/50'
                  : 'bg-purple-950/70 text-pink-300 border-pink-500/40 shadow-md shadow-purple-950/50'
              }`}
            >
              {currentUser?.role === 'admin' ? (
                <Shield className="w-7 h-7 text-amber-400" />
              ) : (
                <User className="w-7 h-7 text-pink-300" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white truncate">
                  {currentUser?.name || 'مستخدم مسجل'}
                </h2>
                {currentUser?.role === 'admin' ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    مشرف النظام
                  </span>
                ) : (
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-bold">
                    عميل
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300 font-medium truncate">
                {currentUser?.email || currentUser?.phone || 'بيانات الحساب محمية'}
              </p>
            </div>
          </div>

          <button
            id="open-account-details-btn"
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800/80 active:scale-95 text-xs font-bold text-purple-200 hover:text-white rounded-xl border border-purple-700/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>عرض</span>
            <ChevronLeft className="w-3.5 h-3.5 text-purple-400" />
          </button>
        </div>

        {/* Quick Read-Only Info Strip */}
        <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Mail className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
            <span className="truncate">{currentUser?.email || 'غير مسجل'}</span>
          </div>
          <div className="flex items-center gap-2 text-purple-300">
            <Phone className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
            <span className="truncate">{currentUser?.phone || 'بدون هاتف'}</span>
          </div>
        </div>
      </section>

      {/* Admin Portal (Shown ONLY to Admin users) */}
      {currentUser?.role === 'admin' && onOpenAdminDashboard && (
        <section
          id="settings-admin-section"
          aria-label="إعدادات المشرف"
          className="bg-[#230d43] border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-lg shadow-purple-950/60 text-right space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">لوحة تحكم المشرف (Admin CMS)</h3>
              <p className="text-[11px] text-purple-300 font-medium">
                إدارة المنتجات، الفيديوهات، التصنيفات وحالات الطلبات
              </p>
            </div>
          </div>

          <button
            id="open-admin-cms-btn"
            onClick={onOpenAdminDashboard}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-md shadow-amber-950/50"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <span>فتح لوحة تحكم المشرف (Admin CMS)</span>
            </div>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* 2) المظهر (Appearance) */}
      <section
        id="settings-theme-section"
        aria-label="المظهر"
        className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-5 shadow-lg shadow-purple-950/60 text-right space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <span className="text-base">🎨</span>
            <span>المظهر</span>
          </div>
          <span className="text-[11px] text-purple-300 font-medium">
            {theme === 'dark' ? 'الوضع الداكن نشط' : 'الوضع الفاتح نشط'}
          </span>
        </div>

        <p className="text-xs text-purple-300 font-medium">
          اختر النمط المناسب لك مع الحفاظ الكامل على هوية تطبيق خليكي جميلة:
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Dark Option */}
          <button
            id="theme-dark-btn"
            type="button"
            onClick={() => handleThemeToggle('dark')}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#180730] border-pink-500 ring-2 ring-pink-500/50 shadow-md shadow-pink-950/40 text-white'
                : 'bg-[#180730]/60 border-purple-800/40 text-purple-300 hover:text-white hover:bg-[#180730]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#120424] border border-purple-800/60 flex items-center justify-center text-pink-400">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span>🌙 داكن</span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 text-pink-400" />}
            </div>
            <span className="text-[10px] text-purple-400">الثيم الليلي الأصلي</span>
          </button>

          {/* Light Option */}
          <button
            id="theme-light-btn"
            type="button"
            onClick={() => handleThemeToggle('light')}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-rose-50/20 border-pink-400 ring-2 ring-pink-400/50 shadow-md shadow-purple-950/20 text-white'
                : 'bg-[#180730]/60 border-purple-800/40 text-purple-300 hover:text-white hover:bg-[#180730]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span>☀️ فاتح</span>
              {theme === 'light' && <Check className="w-3.5 h-3.5 text-pink-400" />}
            </div>
            <span className="text-[10px] text-purple-400">نمط نهاري مريح للعين</span>
          </button>
        </div>
      </section>

      {/* 3) الإشعارات (Notifications) */}
      <section
        id="settings-notifications-section"
        aria-label="الإشعارات"
        className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-5 shadow-lg shadow-purple-950/60 text-right space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <Bell className="w-4 h-4 text-pink-400" />
            <span>الإشعارات</span>
          </div>

          {/* iOS-style Toggle Switch */}
          <button
            id="toggle-notifications-switch"
            type="button"
            role="switch"
            aria-checked={notifications}
            onClick={handleNotificationsToggle}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer focus:outline-none ${
              notifications ? 'bg-pink-600' : 'bg-purple-950/80 border border-purple-800/60'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                notifications ? '-translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-purple-300 font-medium leading-relaxed">
          تلقي تنبيهات عند تحديث حالة طلباتك، وإشعارك بالمنتجات والتركيبات التجميلية الجديدة.
        </p>
      </section>

      {/* 4) عن التطبيق (About App) */}
      <section
        id="settings-about-section"
        aria-label="عن التطبيق"
        className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-5 shadow-lg shadow-purple-950/60 text-right space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <Info className="w-4 h-4 text-purple-400" />
            <span>عن التطبيق</span>
          </div>

          <button
            id="open-about-modal-btn"
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="text-xs text-pink-300 hover:text-pink-200 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>التفاصيل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#180730] p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-pink-300">خليكي جميلة</h4>
            <span className="text-[10px] bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-700/50">
              الإصدار 1.2.0
            </span>
          </div>
          <p className="text-xs text-purple-200 font-medium leading-relaxed">
            تطبيق متخصص في مستحضرات التجميل والعناية والجمال.
          </p>
        </div>
      </section>

      {/* 5) الخصوصية والشروط (Privacy & Terms) */}
      <section
        id="settings-privacy-section"
        aria-label="الخصوصية والشروط"
        className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-5 shadow-lg shadow-purple-950/60 text-right space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <Lock className="w-4 h-4 text-pink-400" />
            <span>الخصوصية والشروط</span>
          </div>

          <button
            id="open-privacy-modal-btn"
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-xs text-pink-300 hover:text-pink-200 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>عرض السياسة</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-purple-300 font-medium leading-relaxed">
          الاطلاع على سياسة حماية وأمان البيانات وشروط استخدام منصة وتركيبات خليكي جميلة.
        </p>
      </section>

      {/* 6) تسجيل الخروج (Logout - At the very bottom) */}
      <section id="settings-logout-section" className="pt-2">
        <button
          id="logout-button-main"
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 px-4 bg-rose-950/50 hover:bg-rose-900/70 active:scale-[0.99] text-rose-300 hover:text-rose-200 border border-rose-800/60 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-950/30"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>تسجيل الخروج</span>
        </button>
      </section>

      {/* ==========================================================
          MODALS & DIALOGS
         ========================================================== */}

      {/* Modal: My Account Details (Read-only as specified) */}
      {showAccountModal && (
        <div
          id="account-details-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/60">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <User className="w-4 h-4 text-pink-400" />
                <span>بيانات حسابي</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold">الاسم:</span>
                <p className="font-extrabold text-white text-sm">{currentUser?.name || 'غير مسجل'}</p>
              </div>

              <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold">البريد الإلكتروني:</span>
                <p className="font-bold text-purple-200">{currentUser?.email || 'غير مسجل'}</p>
              </div>

              <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold">رقم الهاتف:</span>
                <p className="font-bold text-purple-200">{currentUser?.phone || 'غير مسجل'}</p>
              </div>

              <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold">نوع الحساب:</span>
                <p className="font-bold text-pink-300">
                  {currentUser?.role === 'admin' ? 'مشرف النظام (Admin)' : 'عميل (User)'}
                </p>
              </div>

              <div className="bg-[#180730] p-3 rounded-2xl border border-purple-800/40 flex items-center justify-between">
                <span className="text-[11px] text-purple-400 font-bold">حالة الحساب:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نشط وموثق</span>
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="w-full py-2.5 bg-purple-800/60 hover:bg-purple-700/80 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: About App */}
      {showAboutModal && (
        <div
          id="about-app-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/60">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <Info className="w-4 h-4 text-pink-400" />
                <span>عن التطبيق</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-950/60">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-extrabold text-white">خليكي جميلة</h3>
              <p className="text-xs text-pink-300 font-semibold">
                تطبيق متخصص في مستحضرات التجميل والعناية والجمال.
              </p>
              <span className="inline-block text-[11px] bg-purple-900/60 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-700/50">
                الإصدار 1.2.0
              </span>
            </div>

            <div className="bg-[#180730] p-3.5 rounded-2xl border border-purple-800/40 space-y-2 text-xs text-purple-200">
              <p className="leading-relaxed">
                يقدم التطبيق تركيبات تجميلية معملية مدروسة، حساب تكاليف الإنتاج وأرباح البيع، شروحات تصنيع عملية، مع إمكانية طلب وتجهيز مستحضرات التجميل بأعلى جودة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 bg-purple-800/60 hover:bg-purple-700/80 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Modal: Privacy & Terms */}
      {showPrivacyModal && (
        <div
          id="privacy-terms-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/60">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                <Lock className="w-4 h-4 text-pink-400" />
                <span>الخصوصية والشروط</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-purple-200 leading-relaxed">
              <div className="bg-[#180730] p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
                <h4 className="font-extrabold text-pink-300 text-xs">١. سياسة الخصوصية وأمان البيانات</h4>
                <p>
                  نحن نولي خصوصية بياناتك اهتماماً فائقاً. يتم حفظ بيانات الحساب وطلباتك بأمان، ولا يتم تداول أو بيع أي بيانات شخصية لأي طرف خارجي.
                </p>
              </div>

              <div className="bg-[#180730] p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
                <h4 className="font-extrabold text-pink-300 text-xs">٢. شروط الاستخدام</h4>
                <p>
                  جميع التركيبات والنسب التجميلية الإرشادية المتوفرة عبر التطبيق مقدمة لأغراض المعرفة والإنتاج الآمن. يُرجى الالتزام بمعايير النظافة والتصنيع الجيد (GMP).
                </p>
              </div>

              <div className="bg-[#180730] p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
                <h4 className="font-extrabold text-pink-300 text-xs">٣. خصوصية الطلبات</h4>
                <p>
                  تخضع جميع طلبات المنتجات للسرية التامة، ويتم معالجتها من قبل فريق الإدارة المختص لتجهيزها ومتابعة تسليمها بأعلى دقة.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 bg-purple-800/60 hover:bg-purple-700/80 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirm Logout */}
      {showLogoutConfirm && (
        <div
          id="logout-confirm-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-[#210a40] border border-rose-800/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-300 mx-auto">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-white">هل تريد تسجيل الخروج؟</h3>
              <p className="text-xs text-purple-300 font-medium leading-relaxed">
                سيتم إنهاء جلستك الحالية والعودة إلى شاشة الدخول. لن يتم حذف حسابك أو طلباتك أو أي من بياناتك.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-logout-btn"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 text-xs font-bold rounded-xl border border-purple-700/50 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                id="confirm-logout-btn"
                type="button"
                onClick={handleConfirmLogout}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-950/50"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
