import React, { useState, useEffect, useRef } from 'react';
import { VideoItem, CategoryItem } from '../../types';
import { extractYouTubeId, getYouTubeThumbnail, getEmbedVideoUrl } from '../../services/storageService';
import { X, UploadCloud, Save, Play, CheckCircle2, Film, Link as LinkIcon, AlertCircle, Sparkles, Tag } from 'lucide-react';
import { PriceDisplay } from '../PriceDisplay';

interface VideoFormModalProps {
  isOpen: boolean;
  video?: VideoItem | null;
  initialVideo?: VideoItem | null;
  categories?: CategoryItem[];
  defaultCategoryId?: string;
  categoryId?: string;
  defaultOrder?: number;
  onClose: () => void;
  onSave: (video: VideoItem) => void;
}

export const VideoFormModal: React.FC<VideoFormModalProps> = ({
  isOpen,
  video,
  initialVideo,
  defaultCategoryId = 'detergents',
  categoryId,
  defaultOrder = 1,
  onClose,
  onSave
}) => {
  const activeVideo = initialVideo !== undefined ? initialVideo : video;
  const activeCatId = categoryId || defaultCategoryId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'youtube' | 'file'>('youtube');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [currency, setCurrency] = useState('جنيه');
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [specialOfferText, setSpecialOfferText] = useState('✕ عرض خاص');
  const [fileName, setFileName] = useState('');
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    if (activeVideo) {
      setTitle(activeVideo.title || '');
      setVideoUrl(activeVideo.videoUrl || '');
      setUsageInstructions(activeVideo.usageInstructions || '');
      setPrice(activeVideo.price !== undefined && activeVideo.price !== null ? activeVideo.price : '');
      setCurrency(activeVideo.currency || 'جنيه');
      setIsSpecialOffer(!!activeVideo.isSpecialOffer);
      setSpecialOfferText(activeVideo.specialOfferText || '✕ عرض خاص');
      const isFile = (activeVideo.videoUrl || '').startsWith('blob:') || (activeVideo.videoUrl || '').startsWith('data:');
      setInputMode(isFile ? 'file' : 'youtube');
      setFileName(isFile ? 'فيديو من الهاتف' : '');
    } else {
      setTitle('');
      setVideoUrl('');
      setUsageInstructions('');
      setPrice('');
      setCurrency('جنيه');
      setIsSpecialOffer(false);
      setSpecialOfferText('✕ عرض خاص');
      setFileName('');
      setInputMode('youtube');
    }
    setPreviewActive(false);
  }, [activeVideo, isOpen]);

  if (!isOpen) return null;

  const detectedYouTubeId = extractYouTubeId(videoUrl);
  const ytThumbnail = detectedYouTubeId ? getYouTubeThumbnail(detectedYouTubeId) : null;
  const embedUrl = detectedYouTubeId ? getEmbedVideoUrl(detectedYouTubeId, true) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }

    setFileName(file.name);
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    // Verify if youtube mode has valid id
    if (inputMode === 'youtube' && !detectedYouTubeId && !videoUrl.includes('vimeo')) {
      return;
    }

    const parsedPrice = price !== '' && !isNaN(Number(price)) ? Number(price) : (typeof price === 'number' ? price : 0);

    const payload: VideoItem = {
      id: activeVideo?.id || `vid-${Date.now()}`,
      categoryId: activeCatId,
      title: title.trim(),
      description: '',
      usageInstructions: usageInstructions.trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl: ytThumbnail || '',
      duration: '',
      price: parsedPrice,
      currency: currency.trim() || 'جنيه',
      isSpecialOffer: isSpecialOffer,
      specialOfferText: specialOfferText.trim() || '✕ عرض خاص',
      order: activeVideo?.order || defaultOrder || 1,
      isVisible: true,
      createdAt: activeVideo?.createdAt || new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  const isFormValid = title.trim().length > 0 && (
    inputMode === 'youtube' ? !!detectedYouTubeId || videoUrl.trim().length > 0 : videoUrl.trim().length > 0
  );

  return (
    <div
      id="video-form-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-right my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {activeVideo ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
              </h3>
              <p className="text-[11px] text-purple-300 font-medium">
                مشاهدة مدمجة وسلسة داخل التطبيق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-purple-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Selector */}
        <div className="flex bg-[#16052c] p-1 rounded-2xl border border-purple-800/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setInputMode('youtube')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inputMode === 'youtube'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>رابط YouTube (الموصى به)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inputMode === 'file'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>ملف من الهاتف</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* YOUTUBE INPUT MODE */}
          {inputMode === 'youtube' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>1. رابط فيديو YouTube *</span>
                </span>
                <span className="text-[10px] text-purple-400 font-medium">
                  (يدعم الروابط غير المدرجة Unlisted)
                </span>
              </label>

              <input
                type="text"
                required
                placeholder="الصق الرابط هنا (مثال: https://youtu.be/... أو https://www.youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold"
              />

              {/* Status and Thumbnail Preview */}
              {videoUrl.trim().length > 0 && (
                <div>
                  {detectedYouTubeId ? (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>تم التعرف على الفيديو بنجاح</span>
                        </span>
                      </div>

                      {/* Thumbnail Preview with Play Icon */}
                      {ytThumbnail && (
                        <div
                          onClick={() => setPreviewActive(!previewActive)}
                          className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-emerald-500/30 cursor-pointer group shadow-md"
                        >
                          {previewActive && embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="معاينة الفيديو"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <>
                              <img
                                src={ytThumbnail}
                                alt="صورة الفيديو"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
                                </div>
                              </div>
                              <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] text-white font-bold px-2 py-0.5 rounded-md">
                                اضغط للتجربة داخل المشغل
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>يرجى إدخال رابط YouTube صالح بصيغة (watch أو youtu.be أو Shorts).</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FILE PICKER INPUT MODE */}
          {inputMode === 'file' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-200">1. اختيار ملف الفيديو من الهاتف *</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  videoUrl && videoUrl.startsWith('blob:')
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-purple-600/60 bg-[#17062e] hover:border-purple-400 hover:bg-[#1f093a]'
                }`}
              >
                {videoUrl && videoUrl.startsWith('blob:') ? (
                  <div className="space-y-2 w-full">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                      {fileName || 'تم اختيار الفيديو بنجاح'}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs text-purple-300 underline hover:text-white font-bold cursor-pointer pt-1"
                    >
                      تغيير ملف الفيديو
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-700/50 text-purple-300 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      اضغط لاختيار فيديو من ذاكرة الهاتف
                    </div>
                    <p className="text-[11px] text-purple-300 font-medium">
                      (MP4, MOV, MKV وغيرها)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Title */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
              <span>عنوان الفيديو *</span>
            </label>
            <input
              type="text"
              required
              placeholder="اكتب عنوان الفيديو هنا (مثال: منتج البيتزا / صابون سائل عالي الجودة)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#180730] border border-purple-700/70 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold shadow-inner"
            />
          </div>

          {/* Usage Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-extrabold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-100">
                <span>📝 طريقة الاستخدام</span>
              </span>
              <span className="text-[11px] text-purple-400 font-normal">(تظهر للعميل عند ضغط زر طريقة الاستخدام)</span>
            </label>
            <textarea
              rows={5}
              placeholder="اكتب طريقة الاستخدام الخاصة بهذا الفيديو هنا... (مثال: يتم استخدام المنتج حسب الكمية الموضحة في الفيديو، ثم يترك لمدة 10 دقائق قبل الاستخدام.)"
              value={usageInstructions}
              onChange={(e) => setUsageInstructions(e.target.value)}
              className="w-full bg-[#180730] border border-purple-700/70 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-normal leading-relaxed resize-y shadow-inner"
            />
          </div>

          {/* Product Price & Currency */}
          <div className="space-y-3 bg-[#180730]/70 p-3.5 rounded-2xl border border-purple-800/60">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs sm:text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                  <span>💰 السعر</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="اكتب السعر هنا (مثال: 150)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-[#120422] border border-purple-700/70 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-extrabold text-left shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-extrabold text-purple-200">العملة</label>
                <input
                  type="text"
                  placeholder="جنيه"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#120422] border border-purple-700/70 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-bold text-center shadow-inner"
                />
              </div>
            </div>

            {/* Special Offer Toggle */}
            <div className="pt-2 border-t border-purple-800/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="video-special-offer-toggle"
                  className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-300 cursor-pointer select-none"
                >
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>تفعيل بادج «✕ عرض خاص»</span>
                </label>
                <input
                  id="video-special-offer-toggle"
                  type="checkbox"
                  checked={isSpecialOffer}
                  onChange={(e) => setIsSpecialOffer(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isSpecialOffer && (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="نص البادج (افتراضي: ✕ عرض خاص)"
                    value={specialOfferText}
                    onChange={(e) => setSpecialOfferText(e.target.value)}
                    className="w-full bg-[#120422] border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-200 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <div className="bg-[#120422]/90 p-2.5 rounded-xl border border-purple-800/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-purple-300 font-medium">معاينة شكل السعر:</span>
                    <PriceDisplay
                      price={price || 150}
                      currency={currency || 'جنيه'}
                      isSpecialOffer={true}
                      specialOfferText={specialOfferText || '✕ عرض خاص'}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isFormValid
                  ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-purple-900/50'
                  : 'bg-purple-900/30 text-purple-500 cursor-not-allowed border border-purple-800/30'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>حفظ الفيديو</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
