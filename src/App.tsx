import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TabType, CategoryItem, ProductFormulation, SavedProject, UserOrder, AppNotification } from './types';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { DetergentProjectDetails } from './components/DetergentProjectDetails';
import { FavoritesTab } from './components/FavoritesTab';
import { ProjectsTab } from './components/ProjectsTab';
import { OrdersTab } from './components/OrdersTab';
import { AdminOrders } from './components/admin/AdminOrders';
import { ProfileTab } from './components/ProfileTab';
import { CategoryComingSoonModal } from './components/CategoryComingSoonModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  fetchFavorites,
  getFavoritesCount,
  FAVORITES_UPDATED_EVENT
} from './services/favoritesService';
import {
  getCategories,
  CMS_UPDATED_EVENT,
  getSavedVideos,
  SAVED_VIDEOS_UPDATED_EVENT,
  getUserOrders,
  USER_ORDERS_UPDATED_EVENT,
  checkAuthWithServer,
  fetchCMSDataFromServer,
  fetchUserOrdersFromServer,
  getCurrentUser,
  AUTH_STATE_CHANGED_EVENT,
  AuthUser
} from './services/storageService';
import {
  INITIAL_SAVED_PROJECTS
} from './data/industryData';
import { Smartphone, Monitor, Sparkles, Shield } from 'lucide-react';
import { initAppTheme, NOTIFICATIONS_PREF_CHANGED_EVENT } from './services/themeService';
import {
  fetchNotifications,
  getCachedNotifications,
  NOTIFICATIONS_UPDATED_EVENT,
  initPushNotifications,
  NOTIFICATION_DEEP_LINK_EVENT
} from './services/notificationService';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);
  const [comingSoonCategory, setComingSoonCategory] = useState<CategoryItem | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(INITIAL_SAVED_PROJECTS);
  const [savedVideosCount, setSavedVideosCount] = useState<number>(getSavedVideos().length);
  const [favoritesCount, setFavoritesCount] = useState<number>(() => getFavoritesCount());
  const [orders, setOrders] = useState<UserOrder[]>(() => getUserOrders());
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);

  // Notifications Modal & Count States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getCachedNotifications().notifications);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(() => getCachedNotifications().unreadCount);

  // Deep Link States (Target Order ID or Video ID from Push Notifications)
  const [deepLinkOrderId, setDeepLinkOrderId] = useState<string | null>(null);
  const [deepLinkVideoId, setDeepLinkVideoId] = useState<string | null>(null);

  // Admin Dashboard States: defaults to true if user is admin
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    const user = getCurrentUser();
    return !!user && user.role === 'admin';
  });

  // Check auth and sync data on load
  useEffect(() => {
    initAppTheme();
    fetchCMSDataFromServer();
    checkAuthWithServer().then((user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserOrdersFromServer();
        fetchFavorites().then((r) => setFavoritesCount(r.favoriteVideoIds?.length || 0));
        if (user.role === 'admin') {
          setIsAdminOpen(true);
        }
      }
    });

    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        fetchUserOrdersFromServer();
        fetchFavorites().then((r) => setFavoritesCount(r.favoriteVideoIds?.length || 0));
        if (user.role === 'admin') {
          setIsAdminOpen(true);
        } else {
          setIsAdminOpen(false);
          setActiveTab('home');
          setActiveCategory(null);
        }
      } else {
        setIsAdminOpen(false);
        setFavoritesCount(0);
      }
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
  }, []);

  // Sync saved videos count, favorites count & orders
  useEffect(() => {
    const handleSavedVideosChange = () => {
      setSavedVideosCount(getSavedVideos().length);
    };
    const handleFavoritesChange = (e: any) => {
      setFavoritesCount(e.detail?.count ?? getFavoritesCount());
    };
    const handleOrdersChange = () => {
      setOrders(getUserOrders());
      fetchNotifications();
    };

    window.addEventListener(SAVED_VIDEOS_UPDATED_EVENT, handleSavedVideosChange);
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChange);
    window.addEventListener(USER_ORDERS_UPDATED_EVENT, handleOrdersChange);
    return () => {
      window.removeEventListener(SAVED_VIDEOS_UPDATED_EVENT, handleSavedVideosChange);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChange);
      window.removeEventListener(USER_ORDERS_UPDATED_EVENT, handleOrdersChange);
    };
  }, []);

  // Fetch & sync notifications periodically and on event changes
  useEffect(() => {
    fetchNotifications();

    const handleNotifsUpdate = (e: any) => {
      if (e?.detail) {
        setNotifications(e.detail.notifications || []);
        setUnreadNotifsCount(e.detail.unreadCount || 0);
      } else {
        const cached = getCachedNotifications();
        setNotifications(cached.notifications);
        setUnreadNotifsCount(cached.unreadCount);
      }
    };

    const handlePrefChange = () => {
      fetchNotifications();
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT as any, handleNotifsUpdate);
    window.addEventListener(NOTIFICATIONS_PREF_CHANGED_EVENT as any, handlePrefChange);

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT as any, handleNotifsUpdate);
      window.removeEventListener(NOTIFICATIONS_PREF_CHANGED_EVENT as any, handlePrefChange);
      clearInterval(interval);
    };
  }, []);

  // Browser / Android Back Button Stack Handling
  useEffect(() => {
    const handlePopState = () => {
      if (isAdminOpen) {
        setIsAdminOpen(false);
      } else if (activeCategory) {
        setActiveCategory(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminOpen, activeCategory, activeTab]);

  // Handle Deep Linking from Android Push Notifications & URLs
  const handleDeepLinkPayload = (payload: { url?: string; type?: string; orderId?: string; relatedId?: string }) => {
    let orderId = payload.orderId;
    let videoId = payload.type === 'new_video' ? payload.relatedId : undefined;
    let categoryId = payload.type === 'new_category' ? payload.relatedId : undefined;

    if (payload.url) {
      try {
        const parsed = new URL(payload.url, window.location.origin);
        const qOrder = parsed.searchParams.get('order') || parsed.searchParams.get('orderId');
        const qVideo = parsed.searchParams.get('video') || parsed.searchParams.get('videoId');
        const qCategory = parsed.searchParams.get('category') || parsed.searchParams.get('categoryId');
        const qTab = parsed.searchParams.get('tab');

        if (qOrder) orderId = qOrder;
        if (qVideo) videoId = qVideo;
        if (qCategory) categoryId = qCategory;
        if (qTab && (qTab === 'home' || qTab === 'favorites' || qTab === 'orders' || qTab === 'profile')) {
          setActiveTab(qTab as TabType);
        }
      } catch {
        const matchOrder = payload.url.match(/[?&]order(?:Id)?=([^&]+)/);
        if (matchOrder) orderId = decodeURIComponent(matchOrder[1]);
        const matchVideo = payload.url.match(/[?&]video(?:Id)?=([^&]+)/);
        if (matchVideo) videoId = decodeURIComponent(matchVideo[1]);
        const matchCat = payload.url.match(/[?&]category(?:Id)?=([^&]+)/);
        if (matchCat) categoryId = decodeURIComponent(matchCat[1]);
      }
    }

    if (orderId) {
      setDeepLinkOrderId(orderId);
      setActiveTab('orders');
      setActiveCategory(null);
      setIsAdminOpen(false);
      return;
    }

    if (videoId) {
      setDeepLinkVideoId(videoId);
      const allCats = getCategories();
      const detCat = allCats.find((c) => c.id === 'detergents') || allCats[0];
      if (detCat) {
        setActiveCategory(detCat);
      }
      setActiveTab('home');
      setIsAdminOpen(false);
      return;
    }

    if (categoryId) {
      const allCats = getCategories();
      const targetCat = allCats.find((c) => c.id === categoryId);
      if (targetCat) {
        handleSelectCategory(targetCat);
      }
      setActiveTab('home');
      setIsAdminOpen(false);
      return;
    }
  };

  // Push Notifications initialization & Deep Link event listener
  useEffect(() => {
    const user = getCurrentUser();
    // Rule: Admins NEVER receive push notifications or register for them
    if (user && user.role !== 'admin') {
      initPushNotifications();
    }

    // Process initial deep link from window location search if present
    if (window.location.search) {
      handleDeepLinkPayload({ url: window.location.href });
    }

    const handleDeepLinkEvent = (e: any) => {
      if (e?.detail) {
        handleDeepLinkPayload(e.detail);
      }
    };

    window.addEventListener(NOTIFICATION_DEEP_LINK_EVENT as any, handleDeepLinkEvent);
    return () => {
      window.removeEventListener(NOTIFICATION_DEEP_LINK_EVENT as any, handleDeepLinkEvent);
    };
  }, []);

  const handleSelectCategory = (category: CategoryItem) => {
    if (category.isAvailable !== false) {
      window.history.pushState({ view: 'category', id: category.id }, '');
      setActiveCategory(category);
    } else {
      setComingSoonCategory(category as any);
    }
  };

  const handleToggleSaveProduct = (product: ProductFormulation) => {
    const exists = savedProjects.some((p) => p.formulationId === product.id);
    if (exists) {
      setSavedProjects((prev) => prev.filter((p) => p.formulationId !== product.id));
    } else {
      const newProject: SavedProject = {
        id: `saved-${Date.now()}`,
        formulationId: product.id,
        title: product.name,
        category: 'مستحضرات التجميل والعناية',
        progressPercentage: 10,
        lastUpdated: 'الآن',
        notes: product.description || 'تمت إضافة التركيبة إلى خطة مشاريعي.',
        completedSteps: []
      };
      setSavedProjects((prev) => [newProject, ...prev]);
    }
  };

  const handleDeleteSavedProject = (id: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenFormulationFromProjects = () => {
    const cats = getCategories();
    const detCat = cats.find((c) => c.id === 'detergents') || cats[0];
    if (detCat) {
      window.history.pushState({ view: 'category', id: detCat.id }, '');
      setActiveCategory(detCat);
      setActiveTab('home');
    }
  };

  const savedFormulationIds = savedProjects.map((p) => p.formulationId);
  const isUserAnAdmin = currentUser?.role === 'admin';

  const handleBackCategory = useCallback(() => {
    setActiveCategory(null);
    setDeepLinkVideoId(null);
  }, []);

  const handleOpenAdminDashboard = useCallback(() => {
    window.history.pushState({ view: 'admin' }, '');
    setIsAdminOpen(true);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveCategory(null);
    setActiveTab(tab);
  }, []);

  // Determine TopBar title and subtitle (memoized to prevent re-calculations)
  const headerInfo = useMemo(() => {
    if (activeCategory) {
      return {
        title: activeCategory.title,
        subtitle: activeCategory.badgeText || 'متاح الآن',
        showBack: true
      };
    }
    switch (activeTab) {
      case 'home':
        return {
          title: 'خليكي جميلة',
          subtitle: 'منصة تصنيع مستحضرات التجميل والعناية الاحترافية',
          showBack: false
        };
      case 'favorites':
      case 'projects':
        return {
          title: 'المفضلة ❤️',
          subtitle: 'فيديوهاتك وشروحاتك المفضلة والمحفوظة في حسابك',
          showBack: false
        };
      case 'orders':
        return {
          title: isUserAnAdmin ? 'إدارة الطلبات' : 'طلباتي',
          subtitle: isUserAnAdmin ? 'متابعة وتحديث حالات جميع طلبات العملاء' : 'متابعة حالة طلباتك واستفساراتك',
          showBack: false
        };
      case 'profile':
        return {
          title: 'الإعدادات',
          subtitle: 'تخصيص المظهر، تفاصيل الحساب والإشعارات',
          showBack: false
        };
      default:
        return {
          title: 'خليكي جميلة',
          subtitle: '',
          showBack: false
        };
    }
  }, [activeCategory, activeTab, isUserAnAdmin]);

  // 1. First: Show Splash Screen on initial open
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Second: If user is not authenticated, show the unified single AuthScreen
  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          fetchUserOrdersFromServer();
          if (user.role === 'admin') {
            setIsAdminOpen(true);
          } else {
            setIsAdminOpen(false);
            setActiveTab('home');
            setActiveCategory(null);
          }
        }}
      />
    );
  }

  // 3. Third: If Admin mode is open, render Admin Dashboard in full screen
  if (currentUser.role === 'admin' && isAdminOpen) {
    return <AdminDashboard onExitAdmin={() => setIsAdminOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120424] via-[#1a0734] to-[#250a48] flex flex-col items-center justify-start text-purple-50 antialiased font-cairo">
      {/* Device Frame Viewport Controls (For Desktop Browsing) */}
      <header className="hidden lg:flex w-full max-w-md items-center justify-between py-2 px-4 text-xs text-purple-300">
        <div className="flex items-center gap-1.5 font-bold text-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>تطبيق: خليكي جميلة</span>
        </div>
        <div className="flex items-center gap-2">
          {isUserAnAdmin && (
            <button
              onClick={() => {
                window.history.pushState({ view: 'admin' }, '');
                setIsAdminOpen(true);
              }}
              className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-white px-2.5 py-1 rounded-xl border border-amber-700/50 transition-colors font-bold cursor-pointer"
              title="لوحة المدير"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>لوحة المدير</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileFrameMode(!isMobileFrameMode)}
            className="flex items-center gap-1 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 px-2.5 py-1 rounded-xl shadow-xs border border-purple-700/60 transition-colors font-semibold cursor-pointer"
          >
            {isMobileFrameMode ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-purple-300" />
                <span>عرض متجاوب كامل</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-300" />
                <span>تأطير هاتف</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container / Mobile App Wrapper */}
      <main
        className={`w-full bg-[#18082e] min-h-screen relative flex flex-col transition-all duration-300 ${
          isMobileFrameMode
            ? 'max-w-sm my-4 rounded-[40px] shadow-2xl shadow-purple-950/80 border-[8px] border-purple-950 overflow-hidden ring-1 ring-purple-800/40'
            : 'max-w-md shadow-2xl shadow-purple-950/70 sm:border-x sm:border-purple-900/60'
        }`}
      >
        {/* Dynamic Top Bar */}
        <TopBar
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          showBack={headerInfo.showBack}
          onBack={handleBackCategory}
          isAdmin={isUserAnAdmin}
          unreadNotificationsCount={unreadNotifsCount}
          onNotificationsClick={handleOpenNotifications}
          onToggleAdminMode={handleOpenAdminDashboard}
          onOpenAdminDashboard={handleOpenAdminDashboard}
        />

        {/* Tab Content Canvas */}
        <div className="flex-1 px-4 pt-3 overflow-y-auto">
          {activeCategory ? (
            <DetergentProjectDetails
              category={activeCategory}
              onBack={handleBackCategory}
              savedFormulationIds={savedFormulationIds}
              onToggleSave={handleToggleSaveProduct}
              isAdmin={isUserAnAdmin}
              initialVideoId={deepLinkVideoId || undefined}
              onOpenAdminDashboard={handleOpenAdminDashboard}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeTab onSelectCategory={handleSelectCategory} isAdmin={isUserAnAdmin} />
              )}

              {(activeTab === 'favorites' || activeTab === 'projects') && (
                <FavoritesTab
                  onExploreVideos={() => {
                    const cats = getCategories();
                    const detCat = cats.find((c) => c.id === 'detergents') || cats[0];
                    if (detCat) {
                      window.history.pushState({ view: 'category', id: detCat.id }, '');
                      setActiveCategory(detCat);
                      setActiveTab('home');
                    } else {
                      setActiveTab('home');
                    }
                  }}
                />
              )}

              {activeTab === 'orders' && (
                isUserAnAdmin ? <AdminOrders /> : <OrdersTab orders={orders} selectedOrderId={deepLinkOrderId || undefined} />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  onReopenSplash={() => setShowSplash(true)}
                  savedCount={favoritesCount}
                  onOpenAdminDashboard={handleOpenAdminDashboard}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab === 'projects' ? 'favorites' : activeTab}
          onTabChange={handleTabChange}
          savedCount={favoritesCount}
          ordersCount={orders.length}
          isAdmin={isUserAnAdmin}
        />

        {/* Modal for upcoming categories */}
        <CategoryComingSoonModal
          category={comingSoonCategory}
          onClose={() => setComingSoonCategory(null)}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          notifications={notifications}
          unreadCount={unreadNotifsCount}
          onNavigateToTab={handleTabChange}
        />
      </main>
    </div>
  );
}
