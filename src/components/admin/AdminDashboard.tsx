import React, { useState, useEffect } from 'react';
import {
  VideoItem,
  CategoryItem
} from '../../types';
import {
  getCategories,
  getVideos,
  saveVideo,
  deleteVideo,
  toggleVideoVisibility,
  reorderVideos,
  saveCategory,
  deleteCategory,
  isUserAdmin,
  logoutUser,
  CMS_UPDATED_EVENT
} from '../../services/storageService';
import { AdminVideos } from './AdminVideos';
import { AdminOrders } from './AdminOrders';
import { AdminCategories } from './AdminCategories';
import { AdminSettings } from './AdminSettings';
import {
  ArrowRight,
  Shield,
  Video,
  ShoppingBag,
  FolderTree,
  Settings,
  LogOut
} from 'lucide-react';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

type AdminTab = 'videos' | 'orders' | 'categories' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('videos');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('detergents');

  const refreshData = () => {
    const cats = getCategories();
    setCategories(cats);
    setVideos(getVideos());
    if (cats.length > 0 && !cats.find((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(cats[0].id);
    }
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(CMS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const tabs = [
    { id: 'videos' as AdminTab, label: 'الفيديوهات والشروحات', icon: Video, count: videos.length },
    { id: 'orders' as AdminTab, label: 'إدارة الطلبات', icon: ShoppingBag },
    { id: 'categories' as AdminTab, label: 'الأقسام والمجالات', icon: FolderTree, count: categories.length },
    { id: 'settings' as AdminTab, label: 'الإعدادات والأمان', icon: Settings }
  ];

  if (!isUserAdmin()) {
    return (
      <div className="min-h-screen bg-[#140526] text-purple-50 flex flex-col items-center justify-center p-6 text-center space-y-4 font-cairo" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-600/50 flex items-center justify-center text-rose-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">غير مصرح بالدخول</h2>
        <p className="text-sm text-purple-300 max-w-sm">لوحة التحكم مخصصة لحساب المشرف (Admin) فقط بعد التحقق من الخادم.</p>
        <button
          onClick={onExitAdmin}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          العودة للتطبيق
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140526] text-purple-50 font-cairo pb-16" dir="rtl">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#1c0836]/95 backdrop-blur-md border-b border-purple-800/60 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onExitAdmin}
              className="p-2 -mr-1 rounded-full hover:bg-purple-800/60 active:bg-purple-700/60 text-purple-200 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="الرجوع للتطبيق"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/50">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  لوحة تحكم المدير (CMS)
                </h1>
                <span className="text-[11px] text-purple-300 font-medium">
                  إدارة المحتوى، الفيديوهات، صور المنتجات، والطلبات
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 text-xs font-bold text-purple-200 hover:text-white transition-colors cursor-pointer"
              title="معاينة واجهة العميل"
            >
              <span>معاينة واجهة العميل</span>
            </button>

            <button
              onClick={() => logoutUser()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-xs font-bold text-rose-200 hover:text-white transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sub-navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60 border border-purple-400/40 scale-[1.02]'
                    : 'bg-[#210a40] text-purple-300 hover:text-white hover:bg-purple-800/60 border border-purple-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-purple-800 text-white' : 'bg-purple-950/70 text-purple-300'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-4xl mx-auto px-4 py-3">
        {activeTab === 'videos' && (
          <AdminVideos
            videos={videos}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategoryId={setSelectedCategoryId}
            onSaveVideo={saveVideo}
            onDeleteVideo={deleteVideo}
            onToggleVisibility={toggleVideoVisibility}
            onReorder={reorderVideos}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrders />
        )}

        {activeTab === 'categories' && (
          <AdminCategories
            categories={categories}
            onSaveCategory={saveCategory}
            onDeleteCategory={deleteCategory}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings onRefreshData={refreshData} />
        )}
      </main>
    </div>
  );
};
