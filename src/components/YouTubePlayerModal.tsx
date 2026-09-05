import React, { useState, useEffect, useRef } from 'react';
import { VideoItem } from '../types';
import { extractYouTubeId, getEmbedVideoUrl } from '../services/storageService';
import {
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  ArrowRight,
  ShoppingCart,
  Heart
} from 'lucide-react';
import {
  isVideoFavorite,
  toggleFavoriteVideo,
  FAVORITES_UPDATED_EVENT
} from '../services/favoritesService';

interface YouTubePlayerModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  categoryTitle?: string;
  onOrder?: (video: VideoItem) => void;
}

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  video,
  isOpen,
  onClose,
  onOrder
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [key, setKey] = useState<number>(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && video) {
      setHasError(false);
      setIsLoading(true);
      setIsFullscreenMode(false);
      setKey((prev) => prev + 1);
    }
  }, [isOpen, video]);

  // Handle standard browser fullscreen changes if triggered
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isDocFs && isFullscreenMode) {
        setIsFullscreenMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreenMode]);

  const [, setFavTrigger] = useState(0);

  useEffect(() => {
    const handleFavs = () => {
      setFavTrigger((p) => p + 1);
    };
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavs);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavs);
  }, []);

  if (!isOpen || !video) return null;

  const handleToggleFav = async () => {
    const res = await toggleFavoriteVideo(video);
    if (res.requiresLogin) {
      alert('يرجى تسجيل الدخول لحفظ هذا الفيديو في المفضلة الخاصة بحسابك ❤️');
    }
  };

  const isFav = isVideoFavorite(video.id);

  const ytId = extractYouTubeId(video.videoUrl);
  const embedUrl = getEmbedVideoUrl(video.videoUrl, true);
  const isDirectFile =
    video.videoUrl.startsWith('blob:') ||
    video.videoUrl.startsWith('data:') ||
    video.videoUrl.endsWith('.mp4');

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const handleOrderClick = () => {
    if (onOrder) {
      onOrder(video);
    } else {
      const price = video.price !== undefined && video.price !== null ? video.price : 150;
      const currency = video.currency || 'جنيه';
      const msg = `مرحباً، أرغب في طلب: ${video.title || 'المنتج'} بسعر ${price} ${currency}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!isFullscreenMode) {
      setIsFullscreenMode(true);
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(() => {});
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        }
      }
    } else {
      setIsFullscreenMode(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  return (
    <div
      id="in-app-video-player-modal"
      className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 ${
        isFullscreenMode ? 'p-0 sm:p-2' : 'p-2 sm:p-4 overflow-y-auto'
      }`}
      dir="rtl"
      onClick={onClose}
    >
      <div
        ref={playerContainerRef}
        className={`bg-[#140424] border border-purple-600/60 text-right flex flex-col transition-all duration-200 relative ${
          isFullscreenMode
            ? 'w-full h-full max-w-full rounded-none sm:rounded-2xl p-2 sm:p-3 shadow-2xl justify-between'
            : 'w-full max-w-2xl md:max-w-3xl rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-2xl shadow-purple-950/90 my-auto max-h-[96vh] overflow-y-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. [ مشغل الفيديو الأساسي - يملأ العرض بالكامل مع الحفاظ على أبعاد 16:9 وبدون فراغات ] */}
        <div
          className={`relative w-full overflow-hidden bg-black flex items-center justify-center shadow-2xl flex-shrink-0 group ${
            isFullscreenMode
              ? 'flex-1 h-full min-h-0 rounded-xl sm:rounded-2xl border border-purple-700/80'
              : 'aspect-video rounded-xl sm:rounded-2xl border border-purple-700/60'
          }`}
        >
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#170529] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  عذراً، تعذر تشغيل هذا الفيديو
                </h4>
                <p className="text-xs text-purple-200/80 leading-relaxed font-medium">
                  يرجى التأكد من صحة رابط YouTube أو أن الفيديو متاح في وضع (غير مدرج - Unlisted).
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-purple-900/70 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : isDirectFile ? (
            <video
              key={`file-${key}`}
              src={video.videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          ) : ytId || embedUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-9 h-9 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                  <span className="text-xs text-purple-200 font-bold">جاري تحميل الفيديو...</span>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={`yt-${key}`}
                src={embedUrl}
                title={video.title}
                className="w-full h-full border-0 block"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#170529] space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs text-purple-200">
                رابط الفيديو غير صالح أو غير متاح.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-purple-800 text-white rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

        {/* FULLSCREEN MODE BOTTOM BAR: [ ⛶ تصغير الشاشة ] + [ ← رجوع ] */}
        {isFullscreenMode ? (
          <div className="pt-2 flex items-center justify-between gap-3 flex-shrink-0 w-full">
            {/* Minimize button (Right / First in RTL) */}
            <button
              id="btn-exit-fullscreen-bottom"
              onClick={toggleFullscreen}
              className="flex-1 min-h-[44px] py-2 px-4 bg-purple-900/80 hover:bg-purple-800 active:scale-[0.99] text-purple-200 hover:text-white rounded-xl border border-purple-600/60 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm font-black shadow-lg"
            >
              <Minimize2 className="w-4 h-4 text-purple-300" />
              <span>⛶ تصغير الشاشة</span>
            </button>

            {/* Back button (Left / Second in RTL) */}
            <button
              id="btn-fullscreen-back"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2 px-4 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white text-sm font-black rounded-xl shadow-lg shadow-purple-950/80 transition-all cursor-pointer flex items-center justify-center gap-2 border border-purple-400/40"
            >
              <ArrowRight className="w-4 h-4 text-white" />
              <span>← رجوع</span>
            </button>
          </div>
        ) : (
          /* STANDARD MODE: Fullscreen Button directly below video -> Title -> Description -> [ ← رجوع ] */
          <div className="pt-2.5 space-y-2.5 flex flex-col text-right">
            {/* 2. [ زر ملء الشاشة أسفل الفيديو مباشرة وبشكل واضح واحترافي ] */}
            <button
              id="btn-video-fullscreen-below"
              type="button"
              onClick={toggleFullscreen}
              className="w-full min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-[#20083c] via-[#32105e] to-[#20083c] hover:from-[#2a0b4e] hover:to-[#2a0b4e] active:scale-[0.99] text-purple-100 hover:text-white rounded-xl border border-purple-500/60 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm font-black shadow-md shadow-purple-950/70 hover:border-purple-400 select-none"
              title="عرض الفيديو في وضع ملء الشاشة"
            >
              <Maximize2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
              <span>⛶ ملء الشاشة (Fullscreen)</span>
            </button>

            {/* 3. [ عنوان الفيديو الكبير والواضح مع زر المفضلة ] */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <h1
                id="modal-video-title"
                className="text-base sm:text-lg md:text-xl font-black text-white leading-snug sm:leading-relaxed break-words tracking-tight flex-1"
              >
                {video.title}
              </h1>
              <button
                id={`btn-modal-favorite-${video.id}`}
                type="button"
                onClick={handleToggleFav}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0 ${
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
            </div>

            {/* 4. [ وصف الفيديو ] */}
            {video.description && video.description.trim().length > 0 && (
              <div
                id="modal-video-description-box"
                className="bg-[#200a3e]/70 border border-purple-800/50 rounded-xl p-3 text-right shadow-inner"
              >
                <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal break-words whitespace-pre-line">
                  {video.description}
                </p>
              </div>
            )}

            {/* 5. [ 🛒 اطلب الآن ] Button - Positioned vertically at the top */}
            <div className="pt-1">
              <button
                id="btn-video-order-now"
                type="button"
                onClick={handleOrderClick}
                className="w-full min-h-[46px] sm:min-h-[50px] py-2.5 sm:py-3 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white text-sm sm:text-base font-black rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-950/70 border border-emerald-400/40 transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>🛒 اطلب الآن</span>
              </button>
            </div>

            {/* 6. [ ← رجوع ] Button - Positioned vertically below Order Now */}
            <div>
              <button
                id="btn-video-back"
                type="button"
                onClick={onClose}
                className="w-full min-h-[46px] sm:min-h-[50px] py-2.5 sm:py-3 px-6 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white text-sm sm:text-base font-black rounded-xl sm:rounded-2xl shadow-xl shadow-purple-950/80 transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-purple-400/40"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>← رجوع</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
