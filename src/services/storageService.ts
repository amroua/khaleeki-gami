import { CMSData, CategoryItem, VideoItem, ProductFormulation, SavedVideoItem, UserOrder } from '../types';
import { clearFavoritesCache } from './favoritesService';
import { disassociatePushOnLogout, syncPushUserWithServer } from './notificationService';

const STORAGE_KEY = 'mashrooak_cms_database_v3';
const SAVED_VIDEOS_KEY = 'mashrooak_saved_videos_v1';
const USER_ORDERS_KEY = 'mashrooak_user_orders_v1';
const AUTH_TOKEN_KEY = 'mashrooak_auth_token_v1';
const AUTH_USER_KEY = 'mashrooak_auth_user_v1';

export const CMS_UPDATED_EVENT = 'mashrooak_cms_updated';
export const SAVED_VIDEOS_UPDATED_EVENT = 'mashrooak_saved_videos_updated';
export const USER_ORDERS_UPDATED_EVENT = 'mashrooak_user_orders_updated';
export const AUTH_STATE_CHANGED_EVENT = 'mashrooak_auth_state_changed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
}

// Clean seed category without any demo items
const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'detergents',
    title: 'مستحضرات التجميل والعناية',
    subtitle: 'سيروم، كريمات، غسول، خلطات تجميلية طبيعية',
    iconName: 'Sparkles',
    iconEmoji: '✨',
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-pink-500/40',
    isAvailable: true,
    badgeText: 'متاح للبدء فوراً',
    description: 'دليل شامل لمنتجات وتركيبات العناية بالبشرة والشعر ومستحضرات التجميل.',
    order: 1
  }
];

const DEFAULT_VIDEOS: VideoItem[] = [];

const DEFAULT_PRODUCTS: ProductFormulation[] = [];

// =================== Authentication Service ===================

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isUserAdmin(): boolean {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
}

export function setAuthSession(user: AuthUser, token: string): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, { detail: { user, token } }));
    // Immediately bind device push token to this new user (only if not admin)
    if (user.role !== 'admin') {
      syncPushUserWithServer();
    }
  } catch (err) {
    console.error('Failed to set auth session:', err);
  }
}

export function logoutUser(): void {
  try {
    // Strictly disassociate push token of this device on logout so notifications don't leak
    disassociatePushOnLogout().catch((e) => console.warn('Push logout error:', e));

    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ORDERS_KEY);
    clearFavoritesCache();
    window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: [] }));
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, { detail: null }));
  } catch (err) {
    console.error('Failed to logout:', err);
  }
}

export async function loginWithCredentials(identifier: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    }

    setAuthSession(data.user, data.token);
    return { success: true, user: data.user };
  } catch (err) {
    console.warn('Backend login unavailable:', err);
    return { success: false, error: 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً' };
  }
}

export async function resetAdminPassword(newPassword: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/admin-reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dedlek456@gmail.com', newPassword })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'فشل تعيين كلمة المرور' };
    }

    setAuthSession(data.user, data.token);
    return { success: true, user: data.user };
  } catch (err) {
    console.warn('Reset admin password error:', err);
    return { success: false, error: 'تعذر الاتصال بالخادم لتعيين كلمة المرور' };
  }
}

export async function registerNewUser(name: string, identifier: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, identifier, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'فشل إنشاء الحساب' };
    }

    setAuthSession(data.user, data.token);
    return { success: true, user: data.user };
  } catch (err) {
    console.warn('Backend register error:', err);
    return { success: false, error: 'تعذر الاتصال بالخادم لإنشاء الحساب' };
  }
}

export async function checkAuthWithServer(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        return data.user;
      } else {
        logoutUser();
        return null;
      }
    } else {
      logoutUser();
      return null;
    }
  } catch {
    // Offline or server connection glitch
  }
  return getCurrentUser();
}

// =================== CMS Storage & Server Sync ===================

export async function fetchCMSDataFromServer(): Promise<CMSData | null> {
  try {
    const res = await fetch('/api/cms/data');
    if (res.ok) {
      const data = await res.json();
      if (data && data.videos && Array.isArray(data.videos)) {
        const fullData: CMSData = {
          version: 3,
          categories: data.categories || DEFAULT_CATEGORIES,
          videos: data.videos,
          products: data.products || [],
          lastUpdated: data.settings?.lastUpdated || new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
        window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: fullData }));
        return fullData;
      }
    }
  } catch (err) {
    console.warn('Could not sync CMS data from server:', err);
  }
  return null;
}

// Helper to load CMS data
export function loadCMSData(): CMSData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialData: CMSData = {
        version: 3,
        categories: DEFAULT_CATEGORIES,
        videos: DEFAULT_VIDEOS,
        products: DEFAULT_PRODUCTS,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    const parsed = JSON.parse(raw) as CMSData;
    // ensure fallback fields
    if (!parsed.categories || parsed.categories.length === 0) parsed.categories = DEFAULT_CATEGORIES;
    // Clean up any legacy detergent titles/descriptions in client local cache
    parsed.categories = parsed.categories.map((c) => {
      if (c.id === 'detergents') {
        const updated = { ...c };
        if (updated.title === 'صناعة المنظفات والمطهرات' || updated.title === 'صناعة المنظفات') {
          updated.title = 'مستحضرات التجميل والعناية';
        }
        if (updated.description?.includes('المنظفات والمطهرات') || updated.description?.includes('المنظفات المنزلية')) {
          updated.description = 'دليل شامل لمنتجات وتركيبات العناية بالبشرة والشعر ومستحضرات التجميل.';
        }
        if (updated.subtitle?.includes('الكلور') || updated.subtitle?.includes('الصابون السائل')) {
          updated.subtitle = 'سيروم، كريمات، غسول، خلطات تجميلية طبيعية';
        }
        if (updated.iconEmoji === '🧴') {
          updated.iconEmoji = '✨';
        }
        return updated;
      }
      return c;
    });
    if (!parsed.videos) parsed.videos = [];
    // purge any remaining legacy demo video IDs from old client local storage
    parsed.videos = parsed.videos.filter((v) => !v.id.startsWith('vid-demo'));
    if (!parsed.products) parsed.products = [];
    return parsed;
  } catch (err) {
    console.error('Failed to load CMS data:', err);
    return {
      version: 3,
      categories: DEFAULT_CATEGORIES,
      videos: DEFAULT_VIDEOS,
      products: DEFAULT_PRODUCTS,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Helper to save CMS data (Strict Admin Only)
export function saveCMSData(data: CMSData): void {
  try {
    if (!isUserAdmin()) {
      console.warn('Unauthorized CMS modification attempt blocked: user is not admin');
      return;
    }

    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: data }));

    // If admin is logged in, sync to server in background
    const token = getAuthToken();
    if (token) {
      fetch('/api/admin/cms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categories: data.categories,
          videos: data.videos,
          products: data.products,
          settings: { adminPin: data.adminPin }
        })
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('Server rejected CMS sync with status:', res.status);
            fetchCMSDataFromServer();
          }
        })
        .catch((e) => console.warn('Background CMS sync failed:', e));
    }
  } catch (err) {
    console.error('Failed to save CMS data:', err);
  }
}

// =================== Categories Management ===================
export function getCategories(): CategoryItem[] {
  const data = loadCMSData();
  return data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function saveCategory(category: CategoryItem): void {
  const data = loadCMSData();
  if (!category.id) {
    category.id = `cat-${Date.now()}`;
  }
  const index = data.categories.findIndex((c) => c.id === category.id);
  const isExisting = index >= 0;

  if (isExisting) {
    data.categories[index] = { ...data.categories[index], ...category };
  } else {
    data.categories.push(category);
  }
  saveCMSData(data);

  // Trigger server-side Admin Category API call with JWT Token
  const token = getAuthToken();
  if (token) {
    const method = isExisting ? 'PUT' : 'POST';
    const url = isExisting ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(category)
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('Server rejected category save with status:', res.status);
        } else {
          fetchCMSDataFromServer();
        }
      })
      .catch((e) => console.warn('Background category save failed:', e));
  }
}

export function deleteCategory(id: string): void {
  const data = loadCMSData();
  data.categories = data.categories.filter((c) => c.id !== id);
  data.videos = data.videos.filter((v) => v.categoryId !== id);
  data.products = data.products.filter((p) => p.categoryId !== id);
  saveCMSData(data);

  const token = getAuthToken();
  if (token) {
    fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('Server rejected category deletion with status:', res.status);
        } else {
          fetchCMSDataFromServer();
        }
      })
      .catch((e) => console.warn('Background category delete failed:', e));
  }
}

// =================== Videos Management ===================
export function getVideos(categoryId?: string, onlyVisible = false): VideoItem[] {
  const data = loadCMSData();
  let list = data.videos || [];
  if (categoryId) {
    list = list.filter((v) => v.categoryId === categoryId);
  }
  if (onlyVisible) {
    list = list.filter((v) => v.isVisible !== false);
  }
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function saveVideo(video: VideoItem): void {
  const data = loadCMSData();
  if (!video.id) {
    video.id = `vid-${Date.now()}`;
    video.createdAt = new Date().toISOString();
  }
  const index = data.videos.findIndex((v) => v.id === video.id);
  const isExisting = index >= 0;

  if (isExisting) {
    data.videos[index] = { ...data.videos[index], ...video };
  } else {
    data.videos.push(video);
  }
  saveCMSData(data);

  // Trigger server-side Admin API call with JWT Token
  const token = getAuthToken();
  if (token) {
    const method = isExisting ? 'PUT' : 'POST';
    const url = isExisting ? `/api/admin/videos/${video.id}` : '/api/admin/videos';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(video)
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('Server rejected video save with status:', res.status);
        }
      })
      .catch((e) => console.warn('Server video save error:', e));
  }
}

export function deleteVideo(id: string): void {
  const data = loadCMSData();
  data.videos = data.videos.filter((v) => v.id !== id);
  saveCMSData(data);

  const token = getAuthToken();
  if (token) {
    fetch(`/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).catch((e) => console.warn('Server video delete error:', e));
  }
}

export function toggleVideoVisibility(id: string): void {
  const data = loadCMSData();
  const index = data.videos.findIndex((v) => v.id === id);
  if (index >= 0) {
    data.videos[index].isVisible = !data.videos[index].isVisible;
    saveCMSData(data);
  }
}

export function reorderVideos(videoIdsInOrder: string[]): void {
  const data = loadCMSData();
  videoIdsInOrder.forEach((id, idx) => {
    const item = data.videos.find((v) => v.id === id);
    if (item) {
      item.order = idx + 1;
    }
  });
  saveCMSData(data);
}

// =================== Products Management ===================
export function getProducts(categoryId?: string, onlyVisible = false): ProductFormulation[] {
  const data = loadCMSData();
  let list = data.products || [];
  if (categoryId) {
    list = list.filter((p) => p.categoryId === categoryId);
  }
  if (onlyVisible) {
    list = list.filter((p) => p.isVisible !== false);
  }
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function saveProduct(product: ProductFormulation): void {
  const data = loadCMSData();
  if (!product.id) {
    product.id = `prod-${Date.now()}`;
    product.createdAt = new Date().toISOString();
  }

  if (product.productionCost > 0 && product.sellingPrice > 0) {
    const margin = ((product.sellingPrice - product.productionCost) / product.productionCost) * 100;
    product.profitMargin = `${Math.round(margin)}%`;
  }

  const index = data.products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    data.products[index] = { ...data.products[index], ...product };
  } else {
    data.products.push(product);
  }
  saveCMSData(data);
}

export function deleteProduct(id: string): void {
  const data = loadCMSData();
  data.products = data.products.filter((p) => p.id !== id);
  saveCMSData(data);
}

export function toggleProductVisibility(id: string): void {
  const data = loadCMSData();
  const index = data.products.findIndex((p) => p.id === id);
  if (index >= 0) {
    data.products[index].isVisible = !data.products[index].isVisible;
    saveCMSData(data);
  }
}

export function updateProductPrice(id: string, productionCost: number, sellingPrice: number): void {
  const data = loadCMSData();
  const item = data.products.find((p) => p.id === id);
  if (item) {
    item.productionCost = productionCost;
    item.sellingPrice = sellingPrice;
    if (productionCost > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - productionCost) / productionCost) * 100;
      item.profitMargin = `${Math.round(margin)}%`;
    }
    saveCMSData(data);
  }
}

export function exportDatabaseJSON(): string {
  const data = loadCMSData();
  return JSON.stringify(data, null, 2);
}

export function importDatabaseJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr) as CMSData;
    if (!parsed || !Array.isArray(parsed.categories)) {
      throw new Error('Invalid JSON format');
    }
    saveCMSData(parsed);
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

export function resetDatabaseToDefaults(): void {
  const initialData: CMSData = {
    version: 3,
    categories: DEFAULT_CATEGORIES,
    videos: DEFAULT_VIDEOS,
    products: DEFAULT_PRODUCTS,
    lastUpdated: new Date().toISOString()
  };
  saveCMSData(initialData);
}

// =================== Saved Videos ===================
export function getSavedVideos(): SavedVideoItem[] {
  try {
    const raw = localStorage.getItem(SAVED_VIDEOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get saved videos:', e);
    return [];
  }
}

export function isUserVideoSaved(videoIdOrUrl: string): boolean {
  if (!videoIdOrUrl) return false;
  const list = getSavedVideos();
  return list.some(
    (item) =>
      item.videoId === videoIdOrUrl ||
      item.id === videoIdOrUrl ||
      (item.videoUrl && item.videoUrl === videoIdOrUrl)
  );
}

export function toggleSaveUserVideo(video: VideoItem, categoryTitle?: string): boolean {
  try {
    const list = getSavedVideos();
    const existingIndex = list.findIndex(
      (item) => item.videoId === video.id || item.videoUrl === video.videoUrl
    );

    let isSavedNow = false;
    let updatedList: SavedVideoItem[];

    if (existingIndex >= 0) {
      updatedList = list.filter((_, idx) => idx !== existingIndex);
      isSavedNow = false;
    } else {
      const newItem: SavedVideoItem = {
        id: `saved-vid-${Date.now()}`,
        videoId: video.id,
        title: video.title,
        description: video.description || '',
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || getYouTubeThumbnail(video.videoUrl) || '',
        categoryTitle: categoryTitle || 'مستحضرات التجميل والعناية',
        savedAt: new Date().toISOString()
      };
      updatedList = [newItem, ...list];
      isSavedNow = true;
    }

    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(SAVED_VIDEOS_UPDATED_EVENT, { detail: updatedList }));
    return isSavedNow;
  } catch (e) {
    console.error('Failed to toggle save video:', e);
    return false;
  }
}

export function removeSavedUserVideo(idOrVideoId: string): void {
  try {
    const list = getSavedVideos();
    const updatedList = list.filter(
      (item) => item.id !== idOrVideoId && item.videoId !== idOrVideoId
    );
    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(SAVED_VIDEOS_UPDATED_EVENT, { detail: updatedList }));
  } catch (e) {
    console.error('Failed to remove saved video:', e);
  }
}

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  const embedMatch = trimmed.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  const watchMatch = trimmed.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  const generalMatch = trimmed.match(/(?:v=|\/v\/|\/e\/|\/embed\/|\/shorts\/|youtu\.be\/|\/watch\?v=|\/live\/)([a-zA-Z0-9_-]{11})/i);
  if (generalMatch && generalMatch[1]) return generalMatch[1];

  return null;
}

export function isValidYouTubeUrl(urlOrId: string): boolean {
  return !!extractYouTubeId(urlOrId);
}

export function getEmbedVideoUrl(urlOrId: string, autoplay = true): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    const autoplayParam = autoplay ? '1' : '0';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
    // Official YouTube Embed Parameters:
    // - rel=0: only related videos from the same channel
    // - modestbranding=1: removes large YouTube logo
    // - playsinline=1: inline mobile playback
    // - iv_load_policy=3: disables annotations/interactive cards
    // - controls=1: official player controls
    // - enablejsapi=1: JS API support
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${autoplayParam}&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&controls=1&enablejsapi=1${originParam}`;
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplay ? 1 : 0}`;
  }

  return trimmed;
}

export function getYouTubeThumbnail(urlOrId: string): string | null {
  const ytId = extractYouTubeId(urlOrId);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

// =================== Video Product Images ===================
export async function addVideoProductImage(videoId: string, imageUrl: string): Promise<string[] | null> {
  try {
    const data = loadCMSData();
    const vid = data.videos.find((v) => v.id === videoId);
    if (vid) {
      vid.productImages = vid.productImages || [];
      vid.productImages.push(imageUrl);
      saveCMSData(data);
    }

    const token = getAuthToken();
    if (token) {
      const res = await fetch(`/api/admin/videos/${videoId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl })
      });
      if (res.ok) {
        const json = await res.json();
        return json.productImages || vid?.productImages || null;
      }
    }
    return vid?.productImages || null;
  } catch (e) {
    console.error('Failed to add video image:', e);
    return null;
  }
}

export async function deleteVideoProductImage(videoId: string, imageIndex: number): Promise<string[] | null> {
  try {
    const data = loadCMSData();
    const vid = data.videos.find((v) => v.id === videoId);
    if (vid && Array.isArray(vid.productImages)) {
      vid.productImages.splice(imageIndex, 1);
      saveCMSData(data);
    }

    const token = getAuthToken();
    if (token) {
      const res = await fetch(`/api/admin/videos/${videoId}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageIndex })
      });
      if (res.ok) {
        const json = await res.json();
        return json.productImages || vid?.productImages || null;
      }
    }
    return vid?.productImages || null;
  } catch (e) {
    console.error('Failed to delete video image:', e);
    return null;
  }
}

// =================== Orders ===================
export function getUserOrders(): UserOrder[] {
  try {
    const raw = localStorage.getItem(USER_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get user orders:', e);
    return [];
  }
}

let inFlightOrdersFetch: Promise<UserOrder[]> | null = null;

export async function fetchUserOrdersFromServer(): Promise<UserOrder[]> {
  if (inFlightOrdersFetch) return inFlightOrdersFetch;
  inFlightOrdersFetch = (async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return getUserOrders();
      }
      const admin = isUserAdmin();
      const url = admin ? '/api/admin/orders' : '/api/orders';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const orders = await res.json();
        if (Array.isArray(orders)) {
          localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(orders));
          window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: orders }));
          return orders;
        }
      }
      return getUserOrders();
    } catch (err) {
      console.warn('Failed to fetch orders from server:', err);
      return getUserOrders();
    }
  })().finally(() => {
    inFlightOrdersFetch = null;
  });
  return inFlightOrdersFetch;
}

export function addUserOrder(order: Partial<UserOrder>): UserOrder {
  try {
    const user = getCurrentUser();
    const list = getUserOrders();
    const quantity = order.quantity ? Number(order.quantity) : (order.itemsCount ? Number(order.itemsCount) : 1);
    const unitPrice = order.unitPrice !== undefined && order.unitPrice !== null ? order.unitPrice : (order.price ? String(order.price).replace(/جنيه/g, '').trim() : '0');
    const totalPrice = order.totalPrice !== undefined && order.totalPrice !== null ? order.totalPrice : (order.price ? String(order.price).replace(/جنيه/g, '').trim() : '0');
    const cleanTotal = String(totalPrice).replace(/جنيه/g, '').trim();

    // Prioritize customer name and details entered in the form
    let enteredName = order.userName || '';
    let enteredPhone = order.userPhone || '';
    let enteredAddress = order.userAddress || '';
    if (order.description) {
      if (!enteredName) {
        const nameM = order.description.match(/الاسم:\s*([^|\n\r]+)/);
        if (nameM) enteredName = nameM[1].trim();
      }
      if (!enteredPhone) {
        const phoneM = order.description.match(/الهاتف:\s*([0-9+]+)/);
        if (phoneM) enteredPhone = phoneM[1].trim();
      }
      if (!enteredAddress) {
        const addrM = order.description.match(/العنوان:\s*([^|\n\r]+)/);
        if (addrM) enteredAddress = addrM[1].trim();
      }
    }

    const newOrder: UserOrder = {
      id: order.id || `order-${Date.now()}`,
      userId: user?.id || order.userId || '',
      userEmail: user?.email || order.userEmail || '',
      userName: enteredName || user?.name || '',
      userPhone: enteredPhone || user?.phone || '',
      userAddress: enteredAddress || '',
      orderNumber: order.orderNumber || `#ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      title: order.title || 'طلب منتج',
      type: order.type || 'مستحضرات تجميل',
      quantity,
      itemsCount: quantity,
      unitPrice,
      totalPrice,
      date: order.date || new Date().toLocaleDateString('ar-EG'),
      status: 'pending',
      price: `${cleanTotal} جنيه`,
      description: order.description || '',
      cancelledBy: order.cancelledBy || '',
      cancelledAt: order.cancelledAt || '',
      createdAt: new Date().toISOString()
    };

    const updatedList = [newOrder, ...list];
    localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: updatedList }));

    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Send order to server with authentication headers so MongoDB Atlas stores it
    fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(newOrder)
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
        if (data && data.order) {
          const serverOrder = data.order;
          const current = getUserOrders();
          const synced = [serverOrder, ...current.filter((o) => o.id !== newOrder.id && o.id !== serverOrder.id)];
          localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(synced));
          window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: synced }));
        }
      })
      .catch((e) => console.warn('Server order save failed:', e));

    return newOrder;
  } catch (e) {
    console.error('Failed to add user order:', e);
    return order as UserOrder;
  }
}

export async function updateOrderStatusOnServer(orderId: string, status: string): Promise<UserOrder | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.order) {
        const list = getUserOrders();
        const updatedList = list.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o));
        localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: updatedList }));
        return data.order;
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to update order status on server:', err);
    return null;
  }
}

export async function cancelUserOrder(orderId: string): Promise<{ success: boolean; error?: string; order?: UserOrder }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً لتتمكن من إلغاء الطلب' };
    }

    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = data?.error || 'تعذر إلغاء الطلب، يرجى المحاولة لاحقاً';
      return { success: false, error: errMsg };
    }

    if (data && data.order) {
      const serverOrder = data.order;
      const list = getUserOrders();
      const updatedList = list.map((o) => (o.id === orderId ? { ...o, ...serverOrder, status: 'cancelled', cancelledBy: serverOrder.cancelledBy || 'user' } : o));
      localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: updatedList }));
      return { success: true, order: serverOrder };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to cancel order:', err);
    return { success: false, error: err?.message || 'حدث خطأ في الاتصال بالخادم' };
  }
}

export async function deleteUserOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً لتتمكن من حذف الطلب' };
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = data?.error || 'تعذر حذف الطلب، يرجى المحاولة لاحقاً';
      return { success: false, error: errMsg };
    }

    const list = getUserOrders();
    const updatedList = list.filter((o) => o.id !== orderId);
    localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(USER_ORDERS_UPDATED_EVENT, { detail: updatedList }));

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete order:', err);
    return { success: false, error: err?.message || 'حدث خطأ في الاتصال بالخادم أثناء حذف الطلب' };
  }
}

