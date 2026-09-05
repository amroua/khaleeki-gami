import { AppNotification } from '../types';
import { getSavedNotificationsEnabled } from './themeService';
import { playNotificationSound } from '../utils/notificationSound';
import { getAuthToken } from './storageService';

export const NOTIFICATIONS_UPDATED_EVENT = 'khaleeki_notifications_updated';
export const NOTIFICATION_DEEP_LINK_EVENT = 'khaleeki_notification_deep_link';
const NOTIFICATIONS_CACHE_KEY = 'khaleeki_cached_notifications_v1';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
}

let lastUnreadCount = 0;

export function getCachedNotifications(): NotificationState {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.notifications)) {
        return {
          notifications: parsed.notifications,
          unreadCount: typeof parsed.unreadCount === 'number' ? parsed.unreadCount : 0
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse notifications cache:', e);
  }
  return { notifications: [], unreadCount: 0 };
}

function saveCachedNotifications(state: NotificationState): void {
  try {
    localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: state }));
  } catch (e) {
    console.error('Failed to save notifications cache:', e);
  }
}

let inFlightNotificationsFetch: Promise<NotificationState> | null = null;

export async function fetchNotifications(): Promise<NotificationState> {
  if (inFlightNotificationsFetch) return inFlightNotificationsFetch;

  inFlightNotificationsFetch = (async () => {
    try {
      const notificationsEnabled = getSavedNotificationsEnabled();
      const token = getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `/api/notifications?includeGeneral=${notificationsEnabled}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: HTTP ${res.status}`);
      }

      const data = await res.json();
      const notifications: AppNotification[] = Array.isArray(data.notifications) ? data.notifications : [];
      const unreadCount: number = typeof data.unreadCount === 'number' ? data.unreadCount : notifications.filter(n => !n.isRead).length;
      lastUnreadCount = unreadCount;

      const state: NotificationState = { notifications, unreadCount };
      saveCachedNotifications(state);
      return state;
    } catch (error) {
      console.warn('Using cached notifications due to fetch error:', error);
      return getCachedNotifications();
    }
  })().finally(() => {
    inFlightNotificationsFetch = null;
  });

  return inFlightNotificationsFetch;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const current = getCachedNotifications();
  const updatedList = current.notifications.map((n) => {
    if (n.id === id) {
      return { ...n, isRead: true };
    }
    return n;
  });
  const unreadCount = Math.max(0, updatedList.filter((n) => !n.isRead).length);
  lastUnreadCount = unreadCount;
  saveCachedNotifications({ notifications: updatedList, unreadCount });

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers
    });
  } catch (error) {
    console.warn('Failed to sync notification read state with server:', error);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const current = getCachedNotifications();
  const updatedList = current.notifications.map((n) => ({ ...n, isRead: true }));
  lastUnreadCount = 0;
  saveCachedNotifications({ notifications: updatedList, unreadCount: 0 });

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers
    });
  } catch (error) {
    console.warn('Failed to mark all notifications read on server:', error);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const current = getCachedNotifications();
  const updatedList = current.notifications.filter((n) => n.id !== id);
  const unreadCount = updatedList.filter((n) => !n.isRead).length;
  lastUnreadCount = unreadCount;
  saveCachedNotifications({ notifications: updatedList, unreadCount });

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers
    });
  } catch (error) {
    console.warn('Failed to delete notification on server:', error);
  }
}

export async function clearAllNotifications(): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    lastUnreadCount = 0;
    saveCachedNotifications({ notifications: [], unreadCount: 0 });

    await fetch('/api/notifications/clear', {
      method: 'POST',
      headers
    }).catch((err) => console.warn('Server notification clear warning:', err));

    return { success: true };
  } catch (err: any) {
    console.error('Failed to clear notifications:', err);
    return { success: false, error: err?.message || 'تعذر مسح الإشعارات' };
  }
}

// --------------------------------------------------------------------------
// Android & Browser Push Notification Subsystem
// --------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

let isServiceWorkerRegistered = false;

/**
 * Initialize Push Notifications on app startup:
 * 1. Registers Service Worker `/sw.js`
 * 2. Listens for deep-link messages from notification clicks
 * 3. If permission already granted, refreshes subscription with server
 */
export async function initPushNotifications(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    isServiceWorkerRegistered = true;

    // 2. Listen for messages from Service Worker (Deep Link events)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'APP_NOTIFICATION_CLICK') {
        const payload = event.data.payload || {};
        window.dispatchEvent(
          new CustomEvent(NOTIFICATION_DEEP_LINK_EVENT, { detail: payload })
        );
      }
    });

    // 3. If permission is already granted, ensure subscription is synced with backend
    if (Notification.permission === 'granted') {
      await syncPushSubscriptionWithBackend(registration);
    }
  } catch (err) {
    console.warn('Push notification initialization skipped or not permitted in this context:', err);
  }
}

/**
 * Prompt user for Notification Permission & subscribe to Push Notifications
 */
export async function requestAndSubscribePush(): Promise<{ success: boolean; permission: string; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, permission: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { success: false, permission };
    }

    await syncPushSubscriptionWithBackend(registration);
    return { success: true, permission: 'granted' };
  } catch (err: any) {
    console.error('Failed to request or subscribe push:', err);
    return { success: false, permission: Notification.permission || 'denied', error: err?.message || String(err) };
  }
}

export function clearNotificationCache(): void {
  try {
    localStorage.removeItem(NOTIFICATIONS_CACHE_KEY);
    lastUnreadCount = 0;
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: { notifications: [], unreadCount: 0 } }));
  } catch (e) {
    console.error('Failed to clear notifications cache:', e);
  }
}

/**
 * Subscribes to PushManager and synchronizes with server
 */
async function syncPushSubscriptionWithBackend(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    // Admin check: Never subscribe admin to push notifications
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.role === 'admin') {
          console.log('Push subscription skipped for admin account');
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    // Fetch VAPID Public Key from server
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) throw new Error('Failed to retrieve VAPID key');
    const { publicKey } = await keyRes.json();
    if (!publicKey) throw new Error('Empty VAPID key returned');

    const appServerKey = urlBase64ToUint8Array(publicKey);

    // Get or create subscription
    let subscription = await registration.pushManager.getSubscription();

    // Verify existing subscription against current active VAPID key
    if (subscription) {
      try {
        const rawKey = subscription.options?.applicationServerKey;
        if (rawKey) {
          const currentKeyArray = new Uint8Array(rawKey);
          let keyMatches = currentKeyArray.length === appServerKey.length;
          if (keyMatches) {
            for (let i = 0; i < currentKeyArray.length; i++) {
              if (currentKeyArray[i] !== appServerKey[i]) {
                keyMatches = false;
                break;
              }
            }
          }
          if (!keyMatches) {
            console.log('🔄 VAPID key mismatch detected. Re-subscribing device with current active key...');
            await subscription.unsubscribe();
            subscription = null;
          }
        }
      } catch (err) {
        console.warn('Could not inspect existing subscription options:', err);
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey
      });
    }

    // Send to backend with auth token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const subJson = subscription.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subJson.keys,
        notificationsEnabled: getSavedNotificationsEnabled(),
        platform: 'android',
        userAgent: navigator.userAgent
      })
    });
  } catch (err) {
    console.warn('Sync push subscription issue:', err);
  }
}

/**
 * Disassociate push subscription token for this device on logout
 * Strictly removes ONLY this device's token without affecting user's other devices
 */
export async function disassociatePushOnLogout(): Promise<void> {
  clearNotificationCache();
  if (!isPushSupported() || !('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub && sub.endpoint) {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/push/logout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      console.log('Successfully disassociated current device push token on logout');
    }
  } catch (err) {
    console.warn('Failed to disassociate push token on logout:', err);
  }
}

/**
 * Update push notifications enabled preference on backend
 */
export async function updatePushPreferencesOnServer(enabled: boolean): Promise<void> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let endpoint = '';
    if (isPushSupported() && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) endpoint = sub.endpoint;
      } catch {
        // ignore
      }
    }

    await fetch('/api/push/preferences', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        notificationsEnabled: enabled,
        endpoint
      })
    });
  } catch (err) {
    console.warn('Failed to update push preferences on server:', err);
  }
}

/**
 * Sync push subscription user when user logs in or out
 */
export async function syncPushUserWithServer(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await syncPushSubscriptionWithBackend(registration);
    } else if (Notification.permission === 'default') {
      // Prompt user to enable Android notifications and subscribe this device
      await requestAndSubscribePush();
    }
  } catch (err) {
    console.warn('syncPushUserWithServer error:', err);
  }
}
