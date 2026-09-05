import React, { useState, useEffect, useRef } from 'react';
import { VideoItem, CategoryItem } from '../types';
import {
  getVideos,
  saveVideo,
  deleteVideo,
  getYouTubeThumbnail,
  CMS_UPDATED_EVENT,
  addUserOrder,
  addVideoProductImage,
  deleteVideoProductImage
} from '../services/storageService';
import {
  ArrowRight,
  Video,
  Play,
  Plus,
  Edit2,
  Trash2,
  X,
  ShoppingBag,
  CheckCircle2,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Upload,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { VideoFormModal } from './admin/VideoFormModal';
import { DeleteConfirmModal } from './admin/DeleteConfirmModal';
import { YouTubePlayerModal } from './YouTubePlayerModal';
import { PriceDisplay } from './PriceDisplay';
import { Heart } from 'lucide-react';
import {
  isVideoFavorite,
  toggleFavoriteVideo,
  FAVORITES_UPDATED_EVENT
} from '../services/favoritesService';

interface DetergentProjectDetailsProps {
  category?: CategoryItem;
  onBack: () => void;
  savedFormulationIds?: string[];
  onToggleSave?: (product: any) => void;
  isAdmin?: boolean;
  onOpenAdminDashboard?: () => void;
  initialVideoId?: string;
}

export const DetergentProjectDetails: React.FC<DetergentProjectDetailsProps> = React.memo(({
  category,
  onBack,
  isAdmin = false,
  initialVideoId
}) => {
  const categoryId = category?.id || 'detergents';
  const categoryTitle = category?.title || 'مستحضرات التجميل والعناية';
  const categoryIcon = category?.iconEmoji || '✨';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // Instructions & Images Modal State
  const [selectedDetailVideo, setSelectedDetailVideo] = useState<VideoItem | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'instructions' | 'images'>('instructions');
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ordering State
  const [orderingVideo, setOrderingVideo] = useState<{
    video: VideoItem;
    price: number;
    currency: string;
  } | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('');
  const [orderCustomerAddress, setOrderCustomerAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Admin Modals
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);

  const loadData = () => {
    const list = getVideos(categoryId, false);
    setVideos(list);

    // If detail modal is open, keep its video reference fresh
    if (selectedDetailVideo) {
      const fresh = list.find((v) => v.id === selectedDetailVideo.id);
      if (fresh) setSelectedDetailVideo(fresh);
    }
  };

  const [, setFavTrigger] = useState(0);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    const handleFavs = () => {
      setFavTrigger((prev) => prev + 1);
    };

    window.addEventListener(CMS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavs);
    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavs);
    };
  }, [categoryId]);

  // Auto-open video if navigating via deep link
  useEffect(() => {
    if (initialVideoId && videos.length > 0) {
      const target = videos.find((v) => v.id === initialVideoId);
      if (target) {
        setActiveVideo(target);
      }
    }
  }, [initialVideoId, videos]);

  const handleToggleFavorite = async (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    const res = await toggleFavoriteVideo(vid);
    if (res.requiresLogin) {
      alert('يرجى تسجيل الدخول أولاً لحفظ هذا الفيديو في المفضلة الخاصة بحسابك ❤️');
    }
  };

  // Video Actions
  const handleSaveVideo = (videoData: VideoItem) => {
    saveVideo(videoData);
    setIsVideoModalOpen(false);
    setEditingVideo(null);
    loadData();
  };

  const handleDeleteVideo = (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    setDeletingVideo(vid);
  };

  const handleEditVideo = (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    setEditingVideo(vid);
    setIsVideoModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingVideo) return;
    deleteVideo(deletingVideo.id);
    setDeletingVideo(null);
    loadData();
  };

  // Product Image Upload / Delete (Admin Only)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDetailVideo || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // File validation
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const updatedImages = await addVideoProductImage(selectedDetailVideo.id, base64);
        if (updatedImages) {
          setSelectedDetailVideo({
            ...selectedDetailVideo,
            productImages: updatedImages
          });
        }
        loadData();
      }
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      alert('فشل في قراءة ملف الصورة');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProductImage = async (imageIndex: number) => {
    if (!selectedDetailVideo) return;
    if (window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      const updatedImages = await deleteVideoProductImage(selectedDetailVideo.id, imageIndex);
      if (updatedImages !== null) {
        setSelectedDetailVideo({
          ...selectedDetailVideo,
          productImages: updatedImages
        });
      }
      loadData();
    }
  };

  return (
    <div id="detergent-details-view" className="space-y-4 pb-24 pt-1 animate-in fade-in duration-150" dir="rtl">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-home"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:text-white bg-[#260e49] hover:bg-[#31135d] border border-purple-700/60 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للرئيسية</span>
        </button>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          متاح الآن
        </span>
      </div>

      {/* Hero Category Banner */}
      <div className="bg-gradient-to-br from-[#2b0f52] via-[#220d43] to-[#1c0836] border border-purple-700/60 rounded-3xl p-4 sm:p-5 shadow-xl shadow-purple-950/70 text-right space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-purple-900/80 border border-purple-600/50 flex items-center justify-center text-3xl select-none shadow-inner flex-shrink-0">
            {categoryIcon}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {categoryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium mt-0.5">
              {category?.description || 'دليل شامل لمنتجات وتركيبات العناية بالبشرة والشعر ومستحضرات التجميل.'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-900/70 border border-purple-700/50 px-3 py-1 rounded-xl text-purple-200">
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>{videos.length} فيديوهات تعليمية</span>
          </span>
        </div>
      </div>

      {/* Admin Action Buttons (Only visible to verified Admin) */}
      {isAdmin && (
        <div className="flex">
          <button
            id="btn-add-video-admin"
            onClick={() => {
              setEditingVideo(null);
              setIsVideoModalOpen(true);
            }}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/70 border border-purple-400/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>➕ إضافة فيديو</span>
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {videos.length === 0 && (
        <div className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-8 sm:p-10 text-center space-y-3 shadow-xl shadow-purple-950/60 my-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-900/60 border border-purple-600/40 flex items-center justify-center text-3xl shadow-inner">
            🧴
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              لا توجد فيديوهات متاحة حالياً
            </h3>
            <p className="text-xs text-purple-200/80 max-w-sm mx-auto leading-relaxed">
              سيتم إضافة فيديوهات وشروحات جديدة في هذا القسم قريباً.
            </p>
          </div>
        </div>
      )}

      {/* VIDEOS LIST WITH ALTERNATING BORDER COLORS (BLUE / YELLOW) */}
      {videos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-400" />
              <span>فيديوهات الشرح والتطبيق</span>
            </h2>
            <span className="text-xs text-purple-300 font-bold bg-purple-900/60 px-2.5 py-1 rounded-xl border border-purple-700/50">
              {videos.length} فيديو
            </span>
          </div>

          <div className="space-y-6">
            {videos.map((vid, index) => {
              const ytThumbnail = vid.thumbnailUrl || getYouTubeThumbnail(vid.videoUrl);
              const videoPrice = vid.price !== undefined && vid.price !== null && vid.price !== '' ? Number(vid.price) : 150;
              const videoCurrency = vid.currency || 'جنيه';

              // Item 4: Alternating Blue and Yellow borders
              const isBlueBorder = index % 2 === 0;
              const borderStyles = isBlueBorder
                ? 'border-2 border-blue-500/90 hover:border-blue-400 shadow-xl shadow-blue-950/50 ring-1 ring-blue-400/20'
                : 'border-2 border-yellow-400/95 hover:border-yellow-300 shadow-xl shadow-yellow-950/50 ring-1 ring-yellow-400/20';

              const imagesCount = vid.productImages?.length || 0;

              return (
                <div
                  key={vid.id}
                  id={`video-card-${vid.id}`}
                  className={`bg-[#220c42] rounded-3xl p-4 sm:p-5 space-y-4 transition-all duration-200 ${borderStyles}`}
                >
                  {/* Header with Title and Favorite Toggle */}
                  <div className="px-1 flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white leading-snug flex-1">
                      {vid.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {imagesCount > 0 && (
                        <span className="text-[11px] font-bold text-purple-200 bg-purple-900/80 px-2.5 py-0.5 rounded-lg border border-purple-600/50 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-purple-300" />
                          <span>{imagesCount} صور</span>
                        </span>
                      )}
                      {(() => {
                        const isFav = isVideoFavorite(vid.id);
                        return (
                          <button
                            id={`btn-favorite-video-${vid.id}`}
                            onClick={(e) => handleToggleFavorite(e, vid)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
                              isFav
                                ? 'bg-rose-500/20 border-rose-500/80 text-rose-400 hover:bg-rose-500/30'
                                : 'bg-purple-900/50 border-purple-700/50 text-purple-300 hover:text-white hover:bg-purple-800/60'
                            }`}
                            title={isFav ? 'إزالة من المفضلة ❤️' : 'إضافة إلى المفضلة ♡'}
                          >
                            <Heart
                              className={`w-5 h-5 transition-transform ${
                                isFav ? 'fill-rose-500 text-rose-500 scale-110' : 'stroke-[2]'
                              }`}
                            />
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 1. 🎥 مشغل الفيديو */}
                  <div
                    onClick={() => setActiveVideo(vid)}
                    className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#120422] border border-purple-600/50 hover:border-purple-400 cursor-pointer group shadow-inner transition-colors"
                  >
                    {ytThumbnail ? (
                      <img
                        src={ytThumbnail}
                        alt={vid.title || 'فيديو الشرح'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-950/80 flex items-center justify-center text-purple-300">
                        <Video className="w-12 h-12" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-600/95 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-2xl shadow-purple-950/90 group-hover:scale-110 active:scale-95 transition-all">
                        <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-[-1px]" />
                      </div>
                    </div>

                    {/* Admin Action Badges */}
                    {isAdmin && (
                      <div
                        className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleEditVideo(e, vid)}
                          className="p-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-600/50 backdrop-blur-md transition-colors cursor-pointer shadow-md"
                          title="تعديل الفيديو"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteVideo(e, vid)}
                          className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/50 backdrop-blur-md transition-colors cursor-pointer shadow-md"
                          title="حذف الفيديو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. 📝 طريقة الاستخدام وصور المنتج: زر يفتح التبويبات المخصصة */}
                  <button
                    id={`btn-instructions-video-${vid.id}`}
                    onClick={() => {
                      setSelectedDetailVideo(vid);
                      setDetailModalTab('instructions');
                    }}
                    className="w-full py-3 px-4 bg-purple-900/60 hover:bg-purple-800/90 active:scale-[0.99] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-purple-600/60 hover:border-purple-400 transition-all cursor-pointer shadow-md shadow-purple-950/40"
                  >
                    <FileText className="w-4 h-4 text-purple-300" />
                    <span>📝 طريقة الاستخدام</span>
                    {imagesCount > 0 && (
                      <span className="text-[10px] bg-purple-800/80 text-purple-200 px-1.5 py-0.5 rounded-md border border-purple-600/40 mr-1">
                        + {imagesCount} صور
                      </span>
                    )}
                  </button>

                  {/* 3. 💰 السعر مع دعم العرض الخاص */}
                  <div className="py-0.5 px-1">
                    <PriceDisplay
                      price={videoPrice}
                      currency={videoCurrency}
                      isSpecialOffer={vid.isSpecialOffer}
                      specialOfferText={vid.specialOfferText || '✕ عرض خاص'}
                      size="lg"
                    />
                  </div>

                  {/* 4. 🛒 اطلب الآن */}
                  <button
                    id={`btn-order-video-${vid.id}`}
                    onClick={() => {
                      setOrderingVideo({
                        video: vid,
                        price: videoPrice,
                        currency: videoCurrency
                      });
                      setOrderSuccess(false);
                      setOrderCustomerName('');
                      setOrderCustomerPhone('');
                      setOrderCustomerAddress('');
                    }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white rounded-2xl text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 border border-emerald-400/40 transition-all cursor-pointer"
                  >
                    <span>🛒 اطلب الآن</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Integrated In-App YouTube Player Modal */}
      <YouTubePlayerModal
        video={activeVideo}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        categoryTitle={categoryTitle}
        onOrder={(vid) => {
          const videoPrice = vid.price !== undefined && vid.price !== null ? Number(vid.price) : 150;
          const videoCurrency = vid.currency || 'جنيه';
          setActiveVideo(null);
          setOrderingVideo({
            video: vid,
            price: videoPrice,
            currency: videoCurrency
          });
          setOrderSuccess(false);
          setOrderCustomerName('');
          setOrderCustomerPhone('');
          setOrderCustomerAddress('');
        }}
      />

      {/* ========================================================================= */}
      {/* Item 3: DETAIL MODAL WITH "طريقة الاستخدام" AND "صور المنتج" TABS */}
      {/* ========================================================================= */}
      {selectedDetailVideo && (
        <div
          id="product-detail-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          dir="rtl"
          onClick={() => setSelectedDetailVideo(null)}
        >
          <div
            className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl my-6 max-h-[90vh] overflow-y-auto text-right animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 text-purple-300 flex items-center justify-center shadow-inner flex-shrink-0 text-lg">
                  🧴
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {selectedDetailVideo.title || 'تفاصيل المنتج'}
                  </h3>
                  <span className="text-[11px] text-purple-300 font-medium truncate block">
                    {categoryTitle}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailVideo(null)}
                className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer flex-shrink-0 mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SWITCHER: 1. طريقة الاستخدام  |  2. صور المنتج */}
            <div className="bg-[#180730] border border-purple-800/50 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
              <button
                id="tab-instructions-btn"
                onClick={() => setDetailModalTab('instructions')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailModalTab === 'instructions'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📝 طريقة الاستخدام</span>
              </button>

              <button
                id="tab-product-images-btn"
                onClick={() => setDetailModalTab('images')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailModalTab === 'images'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>🖼️ صور المنتج</span>
                <span className="text-[10px] bg-purple-900/80 border border-purple-500/40 px-1.5 py-0.2 rounded-full text-purple-200">
                  {selectedDetailVideo.productImages?.length || 0}
                </span>
              </button>
            </div>

            {/* TAB 1: طريقة الاستخدام */}
            {detailModalTab === 'instructions' && (
              <div className="bg-[#180730] border border-purple-800/40 rounded-2xl p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {selectedDetailVideo.usageInstructions && selectedDetailVideo.usageInstructions.trim().length > 0 ? (
                  <div className="text-xs sm:text-sm text-purple-100 font-normal leading-relaxed whitespace-pre-line">
                    {selectedDetailVideo.usageInstructions}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs sm:text-sm text-purple-300 font-medium">
                      لم تتم إضافة نص طريقة الاستخدام لهذا المنتج بعد.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: صور المنتج (صور المعرض للعميل + رفع/حذف للأدمن فقط) */}
            {detailModalTab === 'images' && (
              <div className="space-y-4">
                {/* Admin-Only: Upload Controls */}
                {isAdmin && (
                  <div className="bg-[#180730] border border-purple-800/50 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>لوحة المشرف: إضافة صور للمنتج</span>
                      </span>
                      {isUploadingImage && (
                        <span className="text-[10px] text-amber-300 flex items-center gap-1 font-bold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>جاري الرفع...</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="admin-image-file-input"
                      />
                      <label
                        htmlFor="admin-image-file-input"
                        className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>➕ رفع صورة من الجهاز / الهاتف</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Images Gallery */}
                {selectedDetailVideo.productImages && selectedDetailVideo.productImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
                    {selectedDetailVideo.productImages.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative group aspect-square rounded-2xl overflow-hidden bg-[#180730] border border-purple-700/60 hover:border-purple-400 transition-all shadow-md cursor-pointer"
                        onClick={() => setSelectedZoomImage(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={`صورة ${imgIdx + 1} - ${selectedDetailVideo.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />

                        {/* Hover Overlay with Zoom Icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="p-2 rounded-full bg-purple-600/90 text-white shadow-lg">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Admin Delete Image Button */}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProductImage(imgIdx);
                            }}
                            className="absolute top-1.5 left-1.5 p-1.5 rounded-xl bg-rose-950/90 text-rose-300 hover:text-white hover:bg-rose-800 border border-rose-600/60 shadow-md transition-colors cursor-pointer z-10"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty Gallery State */
                  <div className="bg-[#180730] border border-purple-800/40 rounded-2xl p-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center mx-auto text-purple-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">لا توجد صور لهذا المنتج حتى الآن</h4>
                    <p className="text-xs text-purple-300 max-w-xs mx-auto">
                      {isAdmin
                        ? 'يمكنك كمشرف رفع صور للمنتج عبر الزر أعلاه وستظهر للعملاء مباشرة.'
                        : 'سيقوم المشرف برفع صور توضيحية لهذا المنتج قريباً.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Modal Action Footer */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-purple-800/40">
              <button
                onClick={() => setSelectedDetailVideo(null)}
                className="py-3 px-4 bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  const vid = selectedDetailVideo;
                  const price = vid.price !== undefined && vid.price !== null ? Number(vid.price) : 150;
                  const currency = vid.currency || 'جنيه';
                  setSelectedDetailVideo(null);
                  setOrderingVideo({ video: vid, price, currency });
                  setOrderSuccess(false);
                  setOrderCustomerName('');
                  setOrderCustomerPhone('');
                  setOrderCustomerAddress('');
                }}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>🛒 اطلب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox / Zoom View for Product Images */}
      {selectedZoomImage && (
        <div
          id="image-zoom-lightbox"
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => setSelectedZoomImage(null)}
        >
          <button
            onClick={() => setSelectedZoomImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-purple-950/80 text-white border border-purple-600/50 hover:bg-purple-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedZoomImage}
            alt="تكبير صورة المنتج"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-purple-700/50"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER NOW MODAL (With Form Fields & WhatsApp Number 01118051964) */}
      {/* ========================================================================= */}
      {orderingVideo && (
        <div
          id="order-now-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          dir="rtl"
          onClick={() => setOrderingVideo(null)}
        >
          <div
            className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl my-8 text-right animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-inner">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">طلب المنتج</h3>
                  <span className="text-[11px] text-purple-300 font-medium">
                    {orderingVideo.video.title || 'طلب منتج'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOrderingVideo(null)}
                className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">تم استلام طلبك بنجاح!</h4>
                  <p className="text-xs text-purple-200">
                    سيتم التواصل معك لتأكيد تفاصيل الشحن والتسليم في أقرب وقت.
                  </p>
                </div>
                <button
                  onClick={() => setOrderingVideo(null)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  حسناً، تم
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (orderingVideo) {
                    addUserOrder({
                      title: orderingVideo.video.title || 'طلب منتج',
                      type: 'خامات أولية',
                      price: `${orderingVideo.price} ${orderingVideo.currency}`,
                      description: `الاسم: ${orderCustomerName.trim()} | الهاتف: ${orderCustomerPhone.trim()}${orderCustomerAddress ? ' | العنوان: ' + orderCustomerAddress.trim() : ''}`,
                      status: 'قيد المراجعة'
                    });
                  }
                  setOrderSuccess(true);
                }}
                className="space-y-3.5"
              >
                {/* Price & Summary Banner */}
                <div className="bg-[#180730] border border-purple-800/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200">إجمالي السعر:</span>
                  <PriceDisplay
                    price={orderingVideo.price}
                    currency={orderingVideo.currency}
                    isSpecialOffer={orderingVideo.video.isSpecialOffer}
                    specialOfferText={orderingVideo.video.specialOfferText || '✕ عرض خاص'}
                    size="md"
                    hidePrefix={true}
                  />
                </div>

                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">الاسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسمك هنا"
                    value={orderCustomerName}
                    onChange={(e) => setOrderCustomerName(e.target.value)}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 01012345678"
                    value={orderCustomerPhone}
                    onChange={(e) => setOrderCustomerPhone(e.target.value)}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold text-left"
                    dir="ltr"
                  />
                </div>

                {/* Optional Address / Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">العنوان أو ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    placeholder="المحافظة / المدينة / العنوان"
                    value={orderCustomerAddress}
                    onChange={(e) => setOrderCustomerAddress(e.target.value)}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>

                {/* Submit Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 border border-emerald-400/40 transition-all cursor-pointer"
                  >
                    <span>تأكيد وإرسال الطلب</span>
                  </button>

                  {/* Item 6: Direct WhatsApp with 01118051964 */}
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `مرحباً، أرغب في طلب: ${orderingVideo.video.title || 'المنتج'} بسعر ${orderingVideo.price} ${orderingVideo.currency}`;
                      const waUrl = `https://wa.me/201118051964?text=${encodeURIComponent(msg)}`;
                      window.open(waUrl, '_blank');
                    }}
                    className="w-full py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-purple-700/40 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>طلب مباشر عبر واتساب</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Video Modal */}
      <VideoFormModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
        initialVideo={editingVideo}
        categoryId={categoryId}
        defaultOrder={videos.length + 1}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingVideo}
        onClose={() => setDeletingVideo(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الفيديو"
        message={`هل أنت متأكد من حذف "${deletingVideo?.title || ''}" نهائياً؟`}
      />
    </div>
  );
});
