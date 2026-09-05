// Service Worker for Android & Web Push Notifications
// App: خليكي جميلة

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Push events from server (FCM / Web Push)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    try {
      data = { message: event.data.text() };
    } catch (e) {
      data = {};
    }
  }

  const title = data.title || 'خليكي جميلة ✨';
  const message = data.message || 'لديك تنبيه جديد من تطبيق خليكي جميلة';

  let targetUrl = data.url || '/';
  if (data.type === 'order_status') {
    targetUrl = `/?order=${encodeURIComponent(data.orderId || data.relatedId || '')}`;
  } else if (data.type === 'new_video' && data.relatedId) {
    targetUrl = `/?video=${encodeURIComponent(data.relatedId)}`;
  } else if (data.type === 'new_category' && data.relatedId) {
    targetUrl = `/?category=${encodeURIComponent(data.relatedId)}`;
  }

  // Android Native Notification Configuration (using PNG raster icons for Android NotificationManager)
  const notificationOptions = {
    body: message,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-96.png',
    image: data.image || undefined,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [300, 100, 300, 100, 300],
    silent: false,
    tag: data.tag || `notif-${data.type || 'general'}-${data.relatedId || data.orderId || Date.now()}`,
    renotify: true,
    requireInteraction: false,
    timestamp: Date.now(),
    data: {
      url: targetUrl,
      orderId: data.orderId || '',
      type: data.type || '',
      relatedId: data.relatedId || '',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle click on Push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'APP_NOTIFICATION_CLICK',
            payload: notifData,
            url: targetUrl
          });
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
