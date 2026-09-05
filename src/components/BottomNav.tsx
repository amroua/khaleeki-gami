import React from 'react';
import { Home, Heart, ShoppingCart, Settings } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedCount?: number;
  ordersCount?: number;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({
  activeTab,
  onTabChange,
  savedCount = 0,
  ordersCount = 0,
  isAdmin = false
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'الرئيسية',
      icon: Home,
      badge: null
    },
    {
      id: 'favorites' as TabType,
      label: 'المفضلة',
      icon: Heart,
      badge: savedCount > 0 ? savedCount : null
    },
    {
      id: 'orders' as TabType,
      label: isAdmin ? 'إدارة الطلبات' : 'طلباتي',
      icon: ShoppingCart,
      badge: ordersCount > 0 ? ordersCount : null
    },
    {
      id: 'profile' as TabType,
      label: 'الإعدادات',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <nav
      id="main-bottom-navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a0733]/95 backdrop-blur-lg border-t border-purple-800/60 shadow-[0_-4px_25px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5 sm:py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 group transition-transform active:scale-95 focus:outline-none cursor-pointer"
            >
              {/* Active pill background */}
              <div
                className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Badge indicator */}
                {tab.badge && (
                  <span
                    id={`nav-badge-${tab.id}`}
                    className="absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 bg-purple-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#1a0733] shadow-sm"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label with crisp, clear font */}
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors duration-150 ${
                  isActive
                    ? 'text-white font-extrabold'
                    : 'text-purple-300 font-medium group-hover:text-purple-100'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
