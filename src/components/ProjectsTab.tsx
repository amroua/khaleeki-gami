import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Trash2,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { SavedProject, FormulationItem, SavedVideoItem, VideoItem } from '../types';
import {
  getSavedVideos,
  removeSavedUserVideo,
  SAVED_VIDEOS_UPDATED_EVENT,
  getYouTubeThumbnail
} from '../services/storageService';
import { YouTubePlayerModal } from './YouTubePlayerModal';

interface ProjectsTabProps {
  savedProjects: SavedProject[];
  onOpenFormulation?: (formulation: FormulationItem) => void;
  onDeleteSavedProject?: (id: string) => void;
  onExploreIndustries: () => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  onExploreIndustries
}) => {
  const [savedVideos, setSavedVideos] = useState<SavedVideoItem[]>(getSavedVideos());
  const [activeVideoModal, setActiveVideoModal] = useState<VideoItem | null>(null);

  // Sync saved videos when storage changes
  useEffect(() => {
    const handleVideosUpdate = () => {
      setSavedVideos(getSavedVideos());
    };
    window.addEventListener(SAVED_VIDEOS_UPDATED_EVENT, handleVideosUpdate);
    return () => {
      window.removeEventListener(SAVED_VIDEOS_UPDATED_EVENT, handleVideosUpdate);
    };
  }, []);

  const handlePlaySavedVideo = (item: SavedVideoItem) => {
    const videoItem: VideoItem = {
      id: item.videoId || item.id,
      categoryId: 'detergents',
      title: item.title,
      description: item.description || '',
      videoUrl: item.videoUrl,
      thumbnailUrl: item.thumbnailUrl,
      order: 1,
      isVisible: true,
      createdAt: item.savedAt
    };
    setActiveVideoModal(videoItem);
  };

  const handleRemoveSavedVideo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedUserVideo(id);
    setSavedVideos(getSavedVideos());
  };

  return (
    <div id="projects-tab-content" className="space-y-4 pb-24 pt-1 animate-in fade-in duration-200" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#230d43] border border-purple-700/60 p-4 rounded-2xl flex items-center justify-between shadow-md shadow-purple-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">مشاريعي والفيديوهات المحفوظة</h2>
            <span className="text-[11px] text-purple-300 font-medium">قائمتك الشخصية للرجوع للشروحات</span>
          </div>
        </div>

        {savedVideos.length > 0 && (
          <span className="bg-purple-600 text-white font-bold px-3 py-1 text-xs rounded-xl shadow-sm">
            {savedVideos.length} فيديو
          </span>
        )}
      </div>

      {/* SECTION: SAVED VIDEOS */}
      <div className="space-y-3">
        {savedVideos.length === 0 ? (
          <div
            id="saved-videos-empty-state"
            className="bg-[#230d43] border border-purple-700/60 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-lg shadow-purple-950/60"
          >
            <div className="w-16 h-16 bg-purple-900/70 text-purple-300 rounded-2xl flex items-center justify-center mx-auto border border-purple-700/50">
              <Video className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">
                لا توجد فيديوهات محفوظة حتى الآن
              </h3>
              <p className="text-xs text-purple-200/80 font-medium max-w-xs mx-auto">
                استكشف الفيديوهات والشروحات العملية المتاحة في الأقسام لمشاهدتها في أي وقت.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onExploreIndustries}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-purple-900/50 transition-all cursor-pointer"
              >
                <span>استكشف الشروحات والفيديوهات</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2.5">
              {savedVideos.map((vid) => {
                const thumbnail = vid.thumbnailUrl || getYouTubeThumbnail(vid.videoUrl);
                return (
                  <div
                    key={vid.id}
                    onClick={() => handlePlaySavedVideo(vid)}
                    className="bg-[#230d43] hover:bg-[#2a1050] border border-purple-700/60 hover:border-purple-500 rounded-2xl p-3 transition-all duration-150 cursor-pointer shadow-md flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail with Play Icon */}
                      <div className="relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden bg-black/60 border border-purple-600/50 flex-shrink-0 flex items-center justify-center group-hover:border-purple-400 transition-colors shadow-inner">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-900/60 flex items-center justify-center text-purple-300">
                            <Video className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-7 h-7 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-purple-500 transition-transform">
                            <Play className="w-3.5 h-3.5 fill-current translate-x-[-0.5px]" />
                          </div>
                        </div>
                      </div>

                      {/* Title & Category Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-100 transition-colors leading-snug line-clamp-2">
                          {vid.title}
                        </h4>
                        <span className="text-[10px] sm:text-[11px] text-purple-300 font-semibold block mt-1">
                          {(vid.categoryTitle && vid.categoryTitle !== 'صناعة المنظفات' && vid.categoryTitle !== 'صناعة المنظفات والمطهرات') ? vid.categoryTitle : 'مستحضرات التجميل والعناية'} • اضغط للتشغيل ▶️
                        </span>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={(e) => handleRemoveSavedVideo(e, vid.id)}
                      className="p-2 rounded-xl bg-purple-900/60 hover:bg-rose-950 text-purple-300 hover:text-rose-300 border border-purple-700/50 hover:border-rose-800/50 transition-colors cursor-pointer flex-shrink-0"
                      title="إزالة من المحفوظة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* In-App Video Player for Saved Videos */}
      <YouTubePlayerModal
        video={activeVideoModal}
        isOpen={!!activeVideoModal}
        onClose={() => setActiveVideoModal(null)}
      />
    </div>
  );
};
