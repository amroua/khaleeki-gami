import { VideoItem } from '../types';
import { getAuthToken, getCurrentUser } from './storageService';

export const FAVORITES_UPDATED_EVENT = 'open_project_favorites_updated';

let cachedFavoriteIds: Set<string> = new Set<string>();
let cachedFavoriteVideos: VideoItem[] = [];
let hasLoadedOnce = false;
let inFlightFavoritesFetch: Promise<{
  success: boolean;
  favoriteVideoIds: string[];
  favorites: VideoItem[];
}> | null = null;

function notifyUpdate(): void {
  const ids = Array.from(cachedFavoriteIds);
  window.dispatchEvent(
    new CustomEvent(FAVORITES_UPDATED_EVENT, {
      detail: {
        favoriteVideoIds: ids,
        favorites: cachedFavoriteVideos,
        count: ids.length
      }
    })
  );
}

/**
 * Check if a video is currently in the favorites (synchronous fast check)
 */
export function isVideoFavorite(videoId: string): boolean {
  if (!videoId) return false;
  return cachedFavoriteIds.has(videoId);
}

/**
 * Get all cached favorite video IDs
 */
export function getFavoriteVideoIds(): string[] {
  return Array.from(cachedFavoriteIds);
}

/**
 * Get count of favorites
 */
export function getFavoritesCount(): number {
  return cachedFavoriteIds.size;
}

/**
 * Get cached favorite videos list
 */
export function getCachedFavoriteVideos(): VideoItem[] {
  return cachedFavoriteVideos;
}

/**
 * Clear cached favorites (used on logout)
 */
export function clearFavoritesCache(): void {
  cachedFavoriteIds = new Set<string>();
  cachedFavoriteVideos = [];
  hasLoadedOnce = false;
  notifyUpdate();
}

/**
 * Fetch favorites from backend (MongoDB Atlas) for the current logged-in user
 */
export async function fetchFavorites(): Promise<{
  success: boolean;
  favoriteVideoIds: string[];
  favorites: VideoItem[];
}> {
  if (inFlightFavoritesFetch) return inFlightFavoritesFetch;

  inFlightFavoritesFetch = (async () => {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || !user) {
      cachedFavoriteIds = new Set<string>();
      cachedFavoriteVideos = [];
      hasLoadedOnce = true;
      notifyUpdate();
      return { success: true, favoriteVideoIds: [], favorites: [] };
    }

    try {
      const res = await fetch('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        clearFavoritesCache();
        return { success: false, favoriteVideoIds: [], favorites: [] };
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const ids: string[] = Array.isArray(data.favoriteVideoIds) ? data.favoriteVideoIds : [];
      const fullVideos: VideoItem[] = Array.isArray(data.favorites) ? data.favorites : [];

      cachedFavoriteIds = new Set(ids);
      cachedFavoriteVideos = fullVideos;
      hasLoadedOnce = true;
      notifyUpdate();

      return {
        success: true,
        favoriteVideoIds: ids,
        favorites: fullVideos
      };
    } catch (err) {
      console.warn('Failed to fetch favorites from server:', err);
      return {
        success: false,
        favoriteVideoIds: Array.from(cachedFavoriteIds),
        favorites: cachedFavoriteVideos
      };
    }
  })().finally(() => {
    inFlightFavoritesFetch = null;
  });

  return inFlightFavoritesFetch;
}

/**
 * Toggle favorite status with optimistic UI update and MongoDB persistence
 */
export async function toggleFavoriteVideo(video: VideoItem): Promise<{
  success: boolean;
  isFavorite: boolean;
  requiresLogin?: boolean;
  error?: string;
}> {
  const token = getAuthToken();
  const user = getCurrentUser();

  if (!token || !user) {
    return {
      success: false,
      isFavorite: false,
      requiresLogin: true,
      error: 'يرجى تسجيل الدخول أولاً لإضافة الفيديو إلى المفضلة'
    };
  }

  const videoId = video.id;
  const currentlyFavorite = cachedFavoriteIds.has(videoId);
  const nextState = !currentlyFavorite;

  // Optimistic update
  if (nextState) {
    cachedFavoriteIds.add(videoId);
    if (!cachedFavoriteVideos.some((v) => v.id === videoId)) {
      cachedFavoriteVideos.push(video);
    }
  } else {
    cachedFavoriteIds.delete(videoId);
    cachedFavoriteVideos = cachedFavoriteVideos.filter((v) => v.id !== videoId);
  }
  notifyUpdate();

  try {
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ videoId })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const confirmedIsFav = !!data.isFavorite;

    // Verify consistency
    if (confirmedIsFav) {
      cachedFavoriteIds.add(videoId);
      if (!cachedFavoriteVideos.some((v) => v.id === videoId)) {
        cachedFavoriteVideos.push(video);
      }
    } else {
      cachedFavoriteIds.delete(videoId);
      cachedFavoriteVideos = cachedFavoriteVideos.filter((v) => v.id !== videoId);
    }
    notifyUpdate();

    return { success: true, isFavorite: confirmedIsFav };
  } catch (err: any) {
    console.error('Failed to toggle favorite on server:', err);

    // Rollback optimistic update
    if (currentlyFavorite) {
      cachedFavoriteIds.add(videoId);
      if (!cachedFavoriteVideos.some((v) => v.id === videoId)) {
        cachedFavoriteVideos.push(video);
      }
    } else {
      cachedFavoriteIds.delete(videoId);
      cachedFavoriteVideos = cachedFavoriteVideos.filter((v) => v.id !== videoId);
    }
    notifyUpdate();

    return {
      success: false,
      isFavorite: currentlyFavorite,
      error: 'حدث خطأ أثناء تحديث المفضلة. يرجى المحاولة مرة أخرى.'
    };
  }
}
