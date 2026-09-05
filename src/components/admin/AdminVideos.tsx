import React, { useState } from 'react';
import { VideoItem, CategoryItem } from '../../types';
import { Plus, Video, Edit, Trash2, Eye, EyeOff, Play, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { VideoFormModal } from './VideoFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { YouTubePlayerModal } from '../YouTubePlayerModal';
import { getYouTubeThumbnail, getEmbedVideoUrl } from '../../services/storageService';

interface AdminVideosProps {
  videos: VideoItem[];
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategoryId: (id: string) => void;
  onSaveVideo: (video: VideoItem) => void;
  onDeleteVideo: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (videoIds: string[]) => void;
}

export const AdminVideos: React.FC<AdminVideosProps> = ({
  videos,
  categories,
  selectedCategoryId,
  onSelectCategoryId,
  onSaveVideo,
  onDeleteVideo,
  onToggleVisibility,
  onReorder
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  const filteredVideos = videos.filter((v) => !selectedCategoryId || v.categoryId === selectedCategoryId);

  const handleOpenAdd = () => {
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: VideoItem) => {
    setEditingVideo(v);
    setIsFormOpen(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const list = [...filteredVideos];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    onReorder(list.map((item) => item.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === filteredVideos.length - 1) return;
    const list = [...filteredVideos];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    onReorder(list.map((item) => item.id));
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Category Filter & Add Button Bar */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-purple-200 whitespace-nowrap">عرض قسم:</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => onSelectCategoryId(e.target.value)}
            className="w-full sm:w-48 bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#180730] text-white">
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-900/50"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فيديو جديد</span>
        </button>
      </div>

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/70 text-purple-300 flex items-center justify-center mx-auto border border-purple-700/50">
            <Video className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-white">لا توجد فيديوهات في هذا القسم حتى الآن</h4>
          <p className="text-xs text-purple-200">اضغط على زر "إضافة فيديو جديد" لإضافة أول فيديو تعليمي.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة محتوى الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((vid, index) => {
            const thumb = vid.thumbnailUrl || getYouTubeThumbnail(vid.videoUrl);
            return (
              <div
                key={vid.id}
                className={`bg-[#210a40] border rounded-2xl p-4 transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  vid.isVisible !== false
                    ? 'border-purple-700/60 hover:border-purple-500'
                    : 'border-purple-900/60 opacity-60 bg-purple-950/40'
                }`}
              >
                {/* Thumbnail and Info */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Order controls */}
                  <div className="flex flex-col gap-1 items-center">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-purple-300 hover:text-white disabled:opacity-20 hover:bg-purple-800/50 rounded-md transition-colors cursor-pointer"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-purple-300">{index + 1}</span>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === filteredVideos.length - 1}
                      className="p-1 text-purple-300 hover:text-white disabled:opacity-20 hover:bg-purple-800/50 rounded-md transition-colors cursor-pointer"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail / Video icon */}
                  <div
                    onClick={() => setPreviewVideo(vid)}
                    className="relative w-20 sm:w-24 h-14 rounded-xl overflow-hidden bg-black/60 border border-purple-700/50 flex-shrink-0 cursor-pointer group"
                  >
                    {thumb ? (
                      <img src={thumb} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-900/60 text-purple-300">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-white truncate max-w-xs">{vid.title}</h4>
                      {vid.isVisible !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          مرئي للكل
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          مخفي
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        💰 السعر: {vid.price !== undefined ? vid.price : 0} {vid.currency || 'جنيه'}
                      </span>
                      {vid.usageInstructions ? (
                        <span className="text-purple-300 bg-purple-900/40 border border-purple-700/40 px-2 py-0.5 rounded-md">
                          📝 توجد طريقة استخدام
                        </span>
                      ) : (
                        <span className="text-purple-400/70 bg-purple-950/30 px-2 py-0.5 rounded-md">
                          (لا توجد طريقة استخدام)
                        </span>
                      )}
                    </div>
                    {vid.usageInstructions && (
                      <p className="text-xs text-purple-200 line-clamp-1 font-medium bg-[#180730]/80 p-1.5 rounded-lg border border-purple-800/40">
                        {vid.usageInstructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setPreviewVideo(vid)}
                    className="p-2 text-purple-300 hover:text-white bg-purple-900/50 hover:bg-purple-800/70 border border-purple-700/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="معاينة الفيديو"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">معاينة</span>
                  </button>

                  <button
                    onClick={() => onToggleVisibility(vid.id)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      vid.isVisible !== false
                        ? 'text-purple-300 hover:text-white bg-purple-900/50 border-purple-700/40'
                        : 'text-amber-300 bg-amber-950/40 border-amber-700/40'
                    }`}
                    title={vid.isVisible !== false ? 'إخفاء الفيديو' : 'إظهار الفيديو'}
                  >
                    {vid.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(vid)}
                    className="p-2 text-purple-200 hover:text-white bg-purple-800/50 hover:bg-purple-700/60 border border-purple-600/50 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="تعديل الفيديو"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>

                  <button
                    onClick={() => setDeletingVideo(vid)}
                    className="p-2 text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="حذف الفيديو"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Form (Add / Edit) */}
      <VideoFormModal
        isOpen={isFormOpen}
        video={editingVideo}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveVideo}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingVideo}
        title="حذف الفيديو"
        itemName={deletingVideo?.title || ''}
        onClose={() => setDeletingVideo(null)}
        onConfirm={() => {
          if (deletingVideo) {
            onDeleteVideo(deletingVideo.id);
          }
        }}
      />

      {/* Player Preview Modal */}
      <YouTubePlayerModal
        video={previewVideo}
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
      />
    </div>
  );
};
