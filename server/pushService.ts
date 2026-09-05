import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import {
  PushSubscriptionModel,
  PushSubscriptionRecord,
  DispatchedPushModel,
  SettingsModel,
  isMongoConnected
} from './db';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const ADMIN_EMAIL = 'dedlek456@gmail.com';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let activeVapidKeys: VapidKeys = {
  publicKey: '',
  privateKey: ''
};

function readLocalDB(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local DB in pushService:', err);
  }
  return {};
}

function writeLocalDB(data: any): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local DB in pushService:', err);
  }
}

/**
 * Initialize VAPID Keys and configure Web Push
 */
export async function initPushService(): Promise<void> {
  try {
    // 1. Check environment variables first
    const envPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC;
    const envPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (envPublicKey && envPrivateKey) {
      activeVapidKeys = {
        publicKey: envPublicKey.trim(),
        privateKey: envPrivateKey.trim()
      };
      console.log('✅ VAPID keys loaded from environment variables.');
    } else {
      // 2. Check MongoDB settings if connected
      let foundInMongo = false;
      if (isMongoConnected()) {
        try {
          const settings = await SettingsModel.findOne({ key: 'main' }).lean().exec();
          if (settings && settings.vapidPublicKey && settings.vapidPrivateKey) {
            activeVapidKeys = {
              publicKey: settings.vapidPublicKey,
              privateKey: settings.vapidPrivateKey
            };
            foundInMongo = true;
            console.log('✅ VAPID keys loaded from MongoDB Atlas.');
          }
        } catch (e) {
          console.warn('Could not read VAPID keys from Mongo:', e);
        }
      }

      // 3. Check local DB if not found in Mongo
      if (!foundInMongo) {
        const local = readLocalDB();
        if (local.settings?.vapidPublicKey && local.settings?.vapidPrivateKey) {
          activeVapidKeys = {
            publicKey: local.settings.vapidPublicKey,
            privateKey: local.settings.vapidPrivateKey
          };
          console.log('✅ VAPID keys loaded from local database.');
        } else {
          // 4. Generate fresh permanent VAPID keys and persist
          console.log('🔑 Generating new VAPID keys for Android Push Notifications...');
          const generated = webpush.generateVAPIDKeys();
          activeVapidKeys = {
            publicKey: generated.publicKey,
            privateKey: generated.privateKey
          };

          // Save to MongoDB if connected
          if (isMongoConnected()) {
            try {
              await SettingsModel.findOneAndUpdate(
                { key: 'main' },
                {
                  $set: {
                    vapidPublicKey: activeVapidKeys.publicKey,
                    vapidPrivateKey: activeVapidKeys.privateKey
                  }
                },
                { upsert: true }
              ).exec();
            } catch (e) {
              console.warn('Could not save VAPID keys to Mongo:', e);
            }
          }

          // Save to local DB
          local.settings = local.settings || {};
          local.settings.vapidPublicKey = activeVapidKeys.publicKey;
          local.settings.vapidPrivateKey = activeVapidKeys.privateKey;
          writeLocalDB(local);
          console.log('✅ New VAPID keys generated and persisted permanently.');
        }
      }
    }

    // Configure web-push details
    let contactSubject = process.env.VAPID_SUBJECT?.trim() || 'mailto:dedlek456@gmail.com';
    if (!contactSubject.startsWith('mailto:') && !contactSubject.startsWith('http://') && !contactSubject.startsWith('https://')) {
      contactSubject = `mailto:${contactSubject}`;
    }
    webpush.setVapidDetails(
      contactSubject,
      activeVapidKeys.publicKey,
      activeVapidKeys.privateKey
    );
    console.log('🚀 Web Push service initialized successfully for Android & Desktop.');
  } catch (err) {
    console.error('❌ Failed to initialize push service:', err);
  }
}

/**
 * Returns the VAPID Public Key for client subscription
 */
export function getVapidPublicKey(): string {
  return activeVapidKeys.publicKey;
}

/**
 * Check if a push event was already dispatched to prevent duplicate notifications
 */
export async function isEventAlreadyDispatched(eventKey: string): Promise<boolean> {
  if (!eventKey) return false;
  if (isMongoConnected()) {
    try {
      const exists = await DispatchedPushModel.findOne({ eventKey }).lean().exec();
      if (exists) return true;
    } catch (err) {
      console.warn('Error checking dispatched push in Mongo:', err);
    }
  }
  const local = readLocalDB();
  const localEvents: string[] = local.dispatchedPushEvents || [];
  return localEvents.includes(eventKey);
}

/**
 * Mark a push event as dispatched for idempotency
 */
export async function markEventDispatched(
  eventKey: string,
  type: string,
  relatedId?: string,
  statusKey?: string
): Promise<void> {
  if (!eventKey) return;
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    try {
      await DispatchedPushModel.findOneAndUpdate(
        { eventKey },
        {
          $setOnInsert: {
            eventKey,
            type,
            relatedId: relatedId || '',
            statusKey: statusKey || '',
            createdAt: now
          }
        },
        { upsert: true }
      ).exec();
    } catch (err) {
      console.warn('Error marking dispatched push in Mongo:', err);
    }
  }
  const local = readLocalDB();
  local.dispatchedPushEvents = local.dispatchedPushEvents || [];
  if (!local.dispatchedPushEvents.includes(eventKey)) {
    local.dispatchedPushEvents.push(eventKey);
    if (local.dispatchedPushEvents.length > 1000) {
      local.dispatchedPushEvents = local.dispatchedPushEvents.slice(-1000);
    }
    writeLocalDB(local);
  }
}

/**
 * Save or update a client push subscription.
 * When a user logs in, this binds this specific device's endpoint to the user.
 * If the user is an Admin, notificationsEnabled is explicitly set to false to prevent admin push notifications.
 */
export async function savePushSubscription(params: {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  userEmail?: string;
  userRole?: 'admin' | 'user' | 'guest';
  platform?: string;
  fcmToken?: string;
  notificationsEnabled?: boolean;
  userAgent?: string;
}): Promise<PushSubscriptionRecord> {
  const { endpoint, keys, userId, userEmail, userRole, platform, fcmToken, notificationsEnabled, userAgent } = params;

  const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : '';
  const isAdmin = userRole === 'admin' || cleanEmail === ADMIN_EMAIL;
  const effectiveRole: 'admin' | 'user' | 'guest' = isAdmin ? 'admin' : (userRole || 'user');
  // Admins must NEVER receive customer push notifications
  const effectiveEnabled = isAdmin ? false : (notificationsEnabled !== false);
  const now = new Date().toISOString();

  const record: PushSubscriptionRecord = {
    id: 'sub-' + Buffer.from(endpoint).toString('base64').substring(0, 24).replace(/[^a-zA-Z0-9]/g, ''),
    userId: userId || '',
    userEmail: cleanEmail,
    userRole: effectiveRole,
    platform: platform || 'android',
    endpoint,
    keys,
    fcmToken: fcmToken || '',
    notificationsEnabled: effectiveEnabled,
    userAgent: userAgent || '',
    createdAt: now,
    updatedAt: now
  };

  // 1. Save to MongoDB if connected (overwrites prior user on this specific endpoint)
  if (isMongoConnected()) {
    try {
      await (PushSubscriptionModel as any).findOneAndUpdate(
        { endpoint },
        {
          $set: {
            userId: record.userId,
            userEmail: record.userEmail,
            userRole: record.userRole,
            platform: record.platform,
            keys: record.keys,
            fcmToken: record.fcmToken,
            notificationsEnabled: record.notificationsEnabled,
            userAgent: record.userAgent,
            updatedAt: now
          },
          $setOnInsert: {
            id: record.id,
            createdAt: now
          }
        },
        { upsert: true, new: true }
      ).exec();
    } catch (err) {
      console.warn('Error saving push subscription to MongoDB:', err);
    }
  }

  // 2. Save to local DB (overwrites prior user on this specific endpoint)
  const local = readLocalDB();
  local.pushSubscriptions = local.pushSubscriptions || [];
  const idx = local.pushSubscriptions.findIndex((s: PushSubscriptionRecord) => s.endpoint === endpoint);
  if (idx >= 0) {
    local.pushSubscriptions[idx] = {
      ...local.pushSubscriptions[idx],
      userId: record.userId,
      userEmail: record.userEmail,
      userRole: record.userRole,
      platform: record.platform,
      keys: record.keys,
      fcmToken: record.fcmToken || local.pushSubscriptions[idx].fcmToken,
      notificationsEnabled: record.notificationsEnabled,
      userAgent: record.userAgent,
      updatedAt: now
    };
  } else {
    local.pushSubscriptions.push(record);
  }
  writeLocalDB(local);

  console.log(`📱 Push subscription saved for endpoint (${endpoint.slice(0, 35)}...): User=${record.userId || record.userEmail || 'guest'}, Role=${record.userRole}, Enabled=${record.notificationsEnabled}`);

  return record;
}

/**
 * Remove / unlink an expired or logged-out device's push subscription.
 * CRITICAL: Only removes the specific device matching `endpoint`.
 * If the user has other devices, those other devices remain untouched!
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;

  if (isMongoConnected()) {
    try {
      await PushSubscriptionModel.deleteOne({ endpoint }).exec();
      console.log(`🗑️ Removed push subscription endpoint from MongoDB (${endpoint.slice(0, 35)}...)`);
    } catch (err) {
      console.warn('Error deleting push subscription from Mongo:', err);
    }
  }

  const local = readLocalDB();
  if (local.pushSubscriptions) {
    local.pushSubscriptions = local.pushSubscriptions.filter(
      (s: PushSubscriptionRecord) => s.endpoint !== endpoint
    );
    writeLocalDB(local);
    console.log(`🗑️ Removed push subscription endpoint from local DB (${endpoint.slice(0, 35)}...)`);
  }
}

/**
 * Update user notification preferences (Opt-in / Opt-out)
 * Does NOT delete any accounts, orders, or favorites!
 */
export async function updatePushPreferences(
  userIdentifier: string,
  notificationsEnabled: boolean
): Promise<void> {
  const cleanId = userIdentifier.trim();
  const cleanEmail = cleanId.toLowerCase();

  if (isMongoConnected()) {
    try {
      await (PushSubscriptionModel as any).updateMany(
        {
          $or: [
            { userId: cleanId },
            { userEmail: cleanEmail }
          ],
          userRole: { $ne: 'admin' } // Never enable push for admin
        },
        {
          $set: {
            notificationsEnabled,
            updatedAt: new Date().toISOString()
          }
        }
      ).exec();
    } catch (err) {
      console.warn('Error updating push preferences in Mongo:', err);
    }
  }

  const local = readLocalDB();
  if (local.pushSubscriptions) {
    local.pushSubscriptions.forEach((s: PushSubscriptionRecord) => {
      if ((s.userId === cleanId || s.userEmail === cleanEmail) && s.userRole !== 'admin') {
        s.notificationsEnabled = notificationsEnabled;
        s.updatedAt = new Date().toISOString();
      }
    });
    writeLocalDB(local);
  }
}

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
  orderId?: string;
  type?: 'order_status' | 'new_video' | 'new_category' | 'offer' | 'general';
  relatedId?: string;
  statusKey?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

/**
 * Send Web Push to a single subscription with auto-cleanup of dead endpoints
 */
async function dispatchPushToSubscription(
  sub: PushSubscriptionRecord,
  payload: PushPayload
): Promise<boolean> {
  // CRITICAL RULE: Never send push to admin accounts!
  if (sub.userRole === 'admin' || (sub.userEmail && sub.userEmail.toLowerCase() === ADMIN_EMAIL)) {
    console.log(`🛑 Skipped sending push to admin device (${sub.endpoint.slice(0, 30)}...).`);
    return false;
  }

  // Check user preference
  if (sub.notificationsEnabled === false) {
    console.log(`🛑 Skipped sending push: notifications disabled for (${sub.endpoint.slice(0, 30)}...).`);
    return false;
  }

  try {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: sub.keys
    };

    const pushPayloadString = JSON.stringify({
      title: payload.title,
      message: payload.message,
      url: payload.url || '/',
      orderId: payload.orderId || '',
      type: payload.type || 'general',
      relatedId: payload.relatedId || '',
      statusKey: payload.statusKey || '',
      tag: payload.tag || `notif-${Date.now()}`,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-96.png',
      timestamp: Date.now()
    });

    await webpush.sendNotification(pushSub, pushPayloadString, {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: 'high' // High priority delivery on Android / FCM
    });
    return true;
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.status;
    // HTTP 410 (Gone) or 404 (Not Found) means the push token has expired on Google's Push servers
    if (statusCode === 410 || statusCode === 404) {
      console.log(`ℹ️ Expired push subscription detected (${sub.endpoint.slice(0, 35)}...). Cleaning up.`);
      await removePushSubscription(sub.endpoint);
    } else {
      console.warn(`⚠️ Push notification failed for endpoint (${sub.endpoint.slice(0, 35)}...):`, err?.message || err);
    }
    return false;
  }
}

/**
 * CRITICAL ISOLATION: Send push notification ONLY to the real customer who owns the order.
 * Strictly verifies that the admin NEVER receives the customer's push notification,
 * and no other customer receives it.
 * Enforces idempotency via eventKey.
 */
export async function sendPushToUser(
  userId: string,
  userEmail: string | undefined,
  payload: PushPayload
): Promise<{ sentCount: number; totalMatched: number }> {
  try {
    const cleanUserId = (userId || '').trim();
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    // 1. Verify recipient is not admin
    if (cleanEmail === ADMIN_EMAIL) {
      console.log('🛑 Target recipient is admin. Skipping push notification.');
      return { sentCount: 0, totalMatched: 0 };
    }

    if (!cleanUserId && !cleanEmail) {
      console.log('ℹ️ No user identifier provided for targeted push. Skipping.');
      return { sentCount: 0, totalMatched: 0 };
    }

    // 2. Check Idempotency
    const eventKey = payload.tag || (payload.orderId && payload.statusKey ? `order-${payload.orderId}-${payload.statusKey}` : '');
    if (eventKey) {
      const alreadySent = await isEventAlreadyDispatched(eventKey);
      if (alreadySent) {
        console.log(`ℹ️ Push event [${eventKey}] was already dispatched. Skipping duplicate.`);
        return { sentCount: 0, totalMatched: 0 };
      }
    }

    let subscriptions: PushSubscriptionRecord[] = [];

    // 3. Query from MongoDB Atlas
    if (isMongoConnected()) {
      try {
        const orQuery: any[] = [];
        if (cleanUserId) orQuery.push({ userId: cleanUserId });
        if (cleanEmail) orQuery.push({ userEmail: cleanEmail });

        subscriptions = await PushSubscriptionModel.find({
          $or: orQuery,
          userRole: { $ne: 'admin' },
          notificationsEnabled: { $ne: false }
        }).lean().exec() as any;
      } catch (err) {
        console.warn('Error fetching subscriptions from Mongo:', err);
      }
    }

    // 4. Query from local DB fallback / merge
    const local = readLocalDB();
    const localSubs: PushSubscriptionRecord[] = local.pushSubscriptions || [];
    for (const ls of localSubs) {
      const match =
        (cleanUserId && ls.userId === cleanUserId) ||
        (cleanEmail && ls.userEmail && ls.userEmail.toLowerCase() === cleanEmail);
      if (
        match &&
        ls.userRole !== 'admin' &&
        ls.notificationsEnabled !== false &&
        !subscriptions.some((s) => s.endpoint === ls.endpoint)
      ) {
        subscriptions.push(ls);
      }
    }

    // 5. Strictly filter to ensure target is owner and NEVER admin
    const strictlyFiltered = subscriptions.filter((s) => {
      if (s.userRole === 'admin') return false;
      if (s.userEmail && s.userEmail.toLowerCase() === ADMIN_EMAIL) return false;
      if (s.notificationsEnabled === false) return false;
      const isOwner =
        (cleanUserId && s.userId === cleanUserId) ||
        (cleanEmail && s.userEmail && s.userEmail.toLowerCase() === cleanEmail);
      return isOwner;
    });

    console.log(`📲 Dispatching order status push to user [${cleanUserId || cleanEmail}]: found ${strictlyFiltered.length} registered device(s).`);

    let sentCount = 0;
    for (const sub of strictlyFiltered) {
      const ok = await dispatchPushToSubscription(sub, payload);
      if (ok) sentCount++;
    }

    // Mark event as dispatched
    if (eventKey && sentCount > 0) {
      await markEventDispatched(eventKey, payload.type || 'order_status', payload.orderId, payload.statusKey);
    }

    return { sentCount, totalMatched: strictlyFiltered.length };
  } catch (err) {
    console.error('Error sending targeted push to user:', err);
    return { sentCount: 0, totalMatched: 0 };
  }
}

/**
 * Broadcast notification to all regular users who have notifications enabled.
 * Used ONLY for "New Video" and "New Category" creation events.
 * Strictly EXCLUDES admin devices.
 * Enforces idempotency via eventKey.
 */
export async function broadcastPushNotification(
  payload: PushPayload
): Promise<{ sentCount: number; totalSubscribers: number }> {
  try {
    // 1. Check Idempotency
    const eventKey = payload.tag || (payload.relatedId ? `${payload.type}-${payload.relatedId}` : '');
    if (eventKey) {
      const alreadySent = await isEventAlreadyDispatched(eventKey);
      if (alreadySent) {
        console.log(`ℹ️ Broadcast event [${eventKey}] was already dispatched. Skipping duplicate.`);
        return { sentCount: 0, totalSubscribers: 0 };
      }
    }

    let subscriptions: PushSubscriptionRecord[] = [];

    // 2. Fetch from MongoDB (strictly excluding admin)
    if (isMongoConnected()) {
      try {
        subscriptions = await PushSubscriptionModel.find({
          notificationsEnabled: { $ne: false },
          userRole: { $ne: 'admin' },
          userEmail: { $ne: ADMIN_EMAIL }
        }).lean().exec() as any;
      } catch (err) {
        console.warn('Error fetching broadcast subscriptions from Mongo:', err);
      }
    }

    // 3. Merge from local DB (strictly excluding admin)
    const local = readLocalDB();
    const localSubs: PushSubscriptionRecord[] = local.pushSubscriptions || [];
    for (const ls of localSubs) {
      const isEligible =
        ls.notificationsEnabled !== false &&
        ls.userRole !== 'admin' &&
        (!ls.userEmail || ls.userEmail.toLowerCase() !== ADMIN_EMAIL);

      if (isEligible && !subscriptions.some((s) => s.endpoint === ls.endpoint)) {
        subscriptions.push(ls);
      }
    }

    // Final security filter: double ensure admin is never in the list
    const filteredSubs = subscriptions.filter(
      (s) => s.userRole !== 'admin' && s.userEmail !== ADMIN_EMAIL && s.notificationsEnabled !== false
    );

    console.log(`📢 Broadcasting push notification to ${filteredSubs.length} opted-in user device(s) (Admin excluded).`);

    let sentCount = 0;
    for (const sub of filteredSubs) {
      const ok = await dispatchPushToSubscription(sub, payload);
      if (ok) sentCount++;
    }

    // Mark event as dispatched
    if (eventKey) {
      await markEventDispatched(eventKey, payload.type || 'general', payload.relatedId, payload.statusKey);
    }

    return { sentCount, totalSubscribers: filteredSubs.length };
  } catch (err) {
    console.error('Error broadcasting push notification:', err);
    return { sentCount: 0, totalSubscribers: 0 };
  }
}
