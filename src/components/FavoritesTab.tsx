import React, { useState, useEffect } from 'react';
import {
  Heart,
  Video,
  Play,
  FileText,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  LogIn,
  CheckCircle2,
  X,
  ImageIcon,
  ZoomIn,
  Package
} from 'lucide-react';
import { VideoItem } from '../types';
import {
  fetchFavorites,
  toggleFavoriteVideo,
  FAVORITES_UPDATED_EVENT
} from '../services/favoritesService';
import {
  getCurrentUser,
  AUTH_STATE_CHANGED_EVENT,
  getYouTubeThumbnail,
  addUserOrder
} from '../services/storageService';
import { PriceDisplay } from './PriceDisplay';
import { YouTubePlayerModal } from './YouTubePlayerModal';

interface FavoritesTabProps {
  onExploreVideos: () => void;
  onOpenLoginModal?: () => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = React.memo(({
  onExploreVideos,
  onOpenLoginModal
}) => {
  const [favorites, setFavorites] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Active Video for YouTube playback
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // Detail Modal for instructions / images
  const [selectedDetailVideo, setSelectedDetailVideo] = useState<VideoItem | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'instructions' | 'images'>('instructions');
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  // Order modal states
  const [orderingVideo, setOrderingVideo] = useState<{
    video: VideoItem;
    price: number;
    currency: string;
  } | null>(null);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('');
  const [orderCustomerAddress, setOrderCustomerAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Sync favorites on mount & on custom events
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      const res = await fetchFavorites();
      if (isMounted) {
        setFavorites(res.favorites || []);
        setIsLoading(false);
      }
    }

    loadData();

    const handleFavUpdated = (e: any) => {
      if (e.detail?.favorites) {
        setFavorites(e.detail.favorites);
      } else {
        fetchFavorites().then((r) => {
          if (isMounted) setFavorites(r.favorites || []);
        });
      }
    };

    const handleAuthChanged = (e: any) => {
      const user = e.detail?.user || getCurrentUser();
      setCurrentUser(user);
      fetchFavorites().then((r) => {
        if (isMounted) setFavorites(r.favorites || []);
      });
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdated);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdated);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  const handleToggleFavorite = async (video: VideoItem) => {
    const res = await toggleFavoriteVideo(video);
    if (res.requiresLogin && onOpenLoginModal) {
      onOpenLoginModal();
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-[#240d47] border border-purple-700/60 rounded-3xl p-4 sm:p-5 shadow-xl shadow-purple-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
              <span>قائمة المفضلة</span>
              <span className="text-rose-400">❤️</span>
            </h1>
            <p className="text-xs text-purple-300 font-medium">
              {currentUser
                ? `محفوظة في حسابك (${currentUser.name || currentUser.email})`
                : 'احفظ فيديوهاتك وشروحاتك المفضلة هنا'}
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <span className="text-xs font-black text-rose-300 bg-rose-950/70 border border-rose-600/50 px-3 py-1.5 rounded-xl shadow-inner">
            {favorites.length} عنصر
          </span>
        )}
      </div>

      {/* Guest Notice if not logged in */}
      {!currentUser && (
        <div className="bg-[#1f093d] border border-amber-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚠️ تنبيه الحفظ الدائم</span>
            </p>
            <p className="text-[11px] text-purple-200">
              سجّل دخولك لحفظ مفضلتك في قاعدة البيانات ومزامنتها دائمًا عبر جميع أجهزتك.
            </p>
          </div>
          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-purple-950 font-black text-xs rounded-xl flex items-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>دخول</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#220c42] rounded-3xl p-5 border border-purple-800/40 space-y-4 animate-pulse"
            >
              <div className="h-6 bg-purple-900/60 rounded-xl w-2/3" />
              <div className="aspect-video bg-purple-950/80 rounded-2xl" />
              <div className="h-10 bg-purple-900/40 rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div
          id="favorites-empty-state"
          className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-xl shadow-purple-950/60 my-4"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-500/40 flex items-center justify-center text-4xl shadow-inner animate-pulse">
            ❤️
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-white leading-snug">
              لم تضف أي عناصر إلى المفضلة بعد ❤️
            </h3>
            <p className="text-xs text-purple-200/80 max-w-sm mx-auto leading-relaxed">
              تصفح الفيديوهات واضغط على زر القلب ♡ لحفظ أي فيديو هنا والوصول إليه بسرعة في أي وقت من هاتفك.
            </p>
          </div>

          <button
            id="btn-explore-from-favorites"
            onClick={onExploreVideos}
            className="w-full sm:w-auto mx-auto py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-950/70 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>تصفح الفيديوهات والأقسام الآن</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Favorites List */}
      {!isLoading && favorites.length > 0 && (
        <div className="space-y-5">
          {favorites.map((vid, index) => {
            const ytThumbnail = vid.thumbnailUrl || getYouTubeThumbnail(vid.videoUrl);
            const videoPrice =
              vid.price !== undefined && vid.price !== null && vid.price !== ''
                ? Number(vid.price)
                : 150;
            const videoCurrency = vid.currency || 'جنيه';
            const imagesCount = vid.productImages?.length || 0;

            const isBlueBorder = index % 2 === 0;
            const borderStyles = isBlueBorder
              ? 'border-2 border-blue-500/90 hover:border-blue-400 shadow-xl shadow-blue-950/50 ring-1 ring-blue-400/20'
              : 'border-2 border-yellow-400/95 hover:border-yellow-300 shadow-xl shadow-yellow-950/50 ring-1 ring-yellow-400/20';

            return (
              <div
                key={vid.id}
                id={`favorite-card-${vid.id}`}
                className={`bg-[#220c42] rounded-3xl p-4 sm:p-5 space-y-4 transition-all duration-200 ${borderStyles}`}
              >
                {/* Header with Title and Red Heart Button */}
                <div className="px-1 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white leading-snug truncate">
                      {vid.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {imagesCount > 0 && (
                      <span className="text-[11px] font-bold text-purple-200 bg-purple-900/80 px-2.5 py-0.5 rounded-lg border border-purple-600/50 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-purple-300" />
                        <span>{imagesCount} صور</span>
                      </span>
                    )}

                    {/* Active Heart (❤️) Button */}
                    <button
                      id={`fav-btn-card-${vid.id}`}
                      onClick={() => handleToggleFavorite(vid)}
                      className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/80 text-rose-400 transition-all active:scale-90 cursor-pointer shadow-md flex items-center justify-center group"
                      title="إزالة من المفضلة ❤️"
                    >
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 1. 🎥 Video Player Thumbnail */}
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
                </div>

                {/* 2. 📝 Usage Instructions & Product Images Button */}
                <button
                  id={`btn-instructions-fav-${vid.id}`}
                  onClick={() => {
                    setSelectedDetailVideo(vid);
                    setDetailModalTab('instructions');
                  }}
                  className="w-full py-3 px-4 bg-purple-900/60 hover:bg-purple-800/90 active:scale-[0.99] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-purple-600/60 hover:border-purple-400 transition-all cursor-pointer shadow-md shadow-purple-950/40"
                >
                  <FileText className="w-4 h-4 text-purple-300" />
                  <span>طريقة الاستخدام وصور المنتج</span>
                  {imagesCount > 0 && (
                    <span className="bg-purple-700/70 text-purple-200 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-purple-500/40">
                      +{imagesCount} صور
                    </span>
                  )}
                </button>

                {/* 3. 🏷️ Price Tag & 4. 🛒 Order Button */}
                <div className="pt-2 border-t border-purple-700/50 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <PriceDisplay
                      price={videoPrice}
                      currency={videoCurrency}
                      isSpecialOffer={vid.isSpecialOffer}
                      specialOfferText={vid.specialOfferText || '✕ عرض خاص'}
                      size="md"
                    />
                  </div>

                  <button
                    id={`btn-order-fav-${vid.id}`}
                    onClick={() => {
                      setOrderingVideo({ video: vid, price: videoPrice, currency: videoCurrency });
                      setOrderSuccess(false);
                      setOrderCustomerName('');
                      setOrderCustomerPhone('');
                      setOrderCustomerAddress('');
                    }}
                    className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>🛒 اطلب الآن</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* YouTube Player Modal */}
      <YouTubePlayerModal
        video={activeVideo}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        categoryTitle="المفضلة ❤️"
        onOrder={(vid) => {
          const price = vid.price !== undefined && vid.price !== null ? Number(vid.price) : 150;
          const currency = vid.currency || 'جنيه';
          setOrderingVideo({ video: vid, price, currency });
          setOrderSuccess(false);
          setOrderCustomerName('');
          setOrderCustomerPhone('');
          setOrderCustomerAddress('');
        }}
      />

      {/* Instructions & Images Modal */}
      {selectedDetailVideo && (
        <div
          id="instructions-modal-fav"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedDetailVideo(null)}
        >
          <div
            className="bg-[#210c40] border-2 border-purple-600/70 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl shadow-purple-950/80 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-700/50 text-purple-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                    {selectedDetailVideo.title || 'تفاصيل المنتج'}
                  </h3>
                  <span className="text-[11px] text-purple-300 font-medium">طريقة الاستخدام والمعرض</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailVideo(null)}
                className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex rounded-2xl bg-[#16062c] p-1 border border-purple-800/50">
              <button
                onClick={() => setDetailModalTab('instructions')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailModalTab === 'instructions'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📝 طريقة الاستخدام</span>
              </button>
              <button
                onClick={() => setDetailModalTab('images')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailModalTab === 'images'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>🖼️ صور المنتج ({selectedDetailVideo.productImages?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: Instructions */}
            {detailModalTab === 'instructions' && (
              <div className="bg-[#180730] border border-purple-800/40 rounded-2xl p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {selectedDetailVideo.usageInstructions &&
                selectedDetailVideo.usageInstructions.trim().length > 0 ? (
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

            {/* TAB 2: Images Gallery */}
            {detailModalTab === 'images' && (
              <div className="space-y-4">
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
                          alt={`صورة ${imgIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="p-2 rounded-full bg-purple-600/90 text-white shadow-lg">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#180730] border border-purple-800/40 rounded-2xl p-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center mx-auto text-purple-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">لا توجد صور لهذا المنتج حتى الآن</h4>
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
                  const price =
                    vid.price !== undefined && vid.price !== null ? Number(vid.price) : 150;
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
                <ShoppingCart className="w-4 h-4" />
                <span>🛒 اطلب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedZoomImage && (
        <div
          id="image-zoom-fav-lightbox"
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

      {/* Order Modal */}
      {orderingVideo && (
        <div
          id="order-modal-fav"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setOrderingVideo(null)}
        >
          <div
            className="bg-[#210c40] border-2 border-emerald-500/70 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl shadow-purple-950/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">طلب المنتج</h3>
                  <span className="text-[11px] text-purple-300 font-medium truncate max-w-[200px] block">
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
                      description: `الاسم: ${orderCustomerName.trim()} | الهاتف: ${orderCustomerPhone.trim()}${
                        orderCustomerAddress ? ' | العنوان: ' + orderCustomerAddress.trim() : ''
                      }`,
                      status: 'قيد المراجعة'
                    });
                  }
                  setOrderSuccess(true);
                }}
                className="space-y-3.5"
              >
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">عنوان التوصيل (اختياري)</label>
                  <input
                    type="text"
                    placeholder="المدينة، المحافظة، تفاصيل العنوان"
                    value={orderCustomerAddress}
                    onChange={(e) => setOrderCustomerAddress(e.target.value)}
                    className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد وإرسال الطلب</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
