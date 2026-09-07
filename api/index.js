// server/app.ts
import express from "express";
import path3 from "path";
import fs3 from "fs";
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// server/db.ts
import mongoose, { Schema } from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
var DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "db.json");
var UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: "", trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var CategorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  iconName: { type: String, default: "Sparkles" },
  iconEmoji: { type: String, default: "\u{1F9F4}" },
  imageUrl: { type: String, default: "" },
  color: { type: String, default: "rose-gold" },
  bgColor: { type: String, default: "bg-rose-900/30" },
  borderColor: { type: String, default: "border-rose-500/40" },
  isAvailable: { type: Boolean, default: true },
  badgeText: { type: String, default: "" },
  description: { type: String, default: "" },
  order: { type: Number, default: 1 }
});
var VideoSchema = new Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  usageInstructions: { type: String, default: "" },
  productImages: { type: [String], default: [] },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: "" },
  duration: { type: String, default: "05:00" },
  price: { type: Number, default: 0 },
  currency: { type: String, default: "\u062C\u0646\u064A\u0647" },
  isSpecialOffer: { type: Boolean, default: false },
  specialOfferText: { type: String, default: "\u2715 \u0639\u0631\u0636 \u062E\u0627\u0635" },
  order: { type: Number, default: 1 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  volumeOrWeight: { type: String, default: "1 \u0644\u062A\u0631" },
  productionCost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  profitMargin: { type: String, default: "0%" },
  isSpecialOffer: { type: Boolean, default: false },
  specialOfferText: { type: String, default: "\u2715 \u0639\u0631\u0636 \u062E\u0627\u0635" },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 1 },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: "", index: true },
  userEmail: { type: String, default: "" },
  userName: { type: String, default: "" },
  userPhone: { type: String, default: "" },
  userAddress: { type: String, default: "" },
  orderNumber: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: "\u0645\u0633\u062A\u062D\u0636\u0631\u0627\u062A \u062A\u062C\u0645\u064A\u0644" },
  quantity: { type: Number, default: 1 },
  itemsCount: { type: Number, default: 1 },
  unitPrice: { type: Schema.Types.Mixed, default: "0" },
  totalPrice: { type: Schema.Types.Mixed, default: "0" },
  price: { type: String, default: "0 \u062C\u0646\u064A\u0647" },
  date: { type: String, default: () => (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG") },
  status: { type: String, default: "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629" },
  description: { type: String, default: "" },
  cancelledBy: { type: String, default: "" },
  cancelledAt: { type: String, default: "" },
  cancelReason: { type: String, default: "" },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var SettingsSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "main" },
  appName: { type: String, default: "\u062E\u0644\u064A\u0643\u064A \u062C\u0645\u064A\u0644\u0629" },
  adminPin: { type: String, default: "1234" },
  lastUpdated: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() },
  vapidPublicKey: { type: String, default: "" },
  vapidPrivateKey: { type: String, default: "" }
});
var NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  targetUserEmail: { type: String, default: "" },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  statusKey: { type: String, default: "" },
  relatedId: { type: String, default: "" },
  readBy: { type: [String], default: [] },
  clearedBy: { type: [String], default: [] },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var PushSubscriptionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: "", index: true },
  userEmail: { type: String, default: "", index: true },
  userRole: { type: String, default: "user", index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  fcmToken: { type: String, default: "" },
  platform: { type: String, default: "android" },
  notificationsEnabled: { type: Boolean, default: true },
  userAgent: { type: String, default: "" },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() },
  updatedAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var DispatchedPushSchema = new Schema({
  eventKey: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  relatedId: { type: String, default: "" },
  statusKey: { type: String, default: "" },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
var FavoriteSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, default: "", index: true },
  videoId: { type: String, required: true, index: true },
  createdAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
});
FavoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
var CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema);
var VideoModel = mongoose.models.Video || mongoose.model("Video", VideoSchema);
var ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
var OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
var SettingsModel = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
var NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
var PushSubscriptionModel = mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);
var DispatchedPushModel = mongoose.models.DispatchedPush || mongoose.model("DispatchedPush", DispatchedPushSchema);
var FavoriteModel = mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
var isConnected = false;
async function connectMongoDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("\u2139\uFE0F MONGODB_URI not provided. Local JSON fallback active.");
    return false;
  }
  try {
    if (isConnected) return true;
    console.log("\u{1F504} Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8e3
    });
    isConnected = true;
    console.log("\u2705 Connected to MongoDB Atlas successfully.");
    await migrateLocalDataToMongo();
    return true;
  } catch (err) {
    console.error("\u274C MongoDB Atlas connection error:", err?.message || err);
    isConnected = false;
    return false;
  }
}
function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
async function migrateLocalDataToMongo() {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const localDB = JSON.parse(raw);
    const adminHash = bcrypt.hashSync("Admin@2026!", 10);
    const adminEmail = "dedlek456@gmail.com";
    const adminExistsInMongo = await UserModel.findOne({ email: adminEmail }).exec();
    if (!adminExistsInMongo) {
      await UserModel.create({
        id: "admin-dedlek456",
        name: "\u0627\u0644\u0623\u062F\u0645\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
        email: adminEmail,
        passwordHash: adminHash,
        role: "admin",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log(`[Migration] Seeded admin user into MongoDB: ${adminEmail} (admin)`);
    } else if (adminExistsInMongo.role !== "admin") {
      adminExistsInMongo.role = "admin";
      adminExistsInMongo.passwordHash = adminHash;
      await adminExistsInMongo.save();
    }
    if (localDB.users && Array.isArray(localDB.users)) {
      for (const u of localDB.users) {
        if (u.email.toLowerCase() === adminEmail) continue;
        const exists = await UserModel.findOne({ email: u.email.toLowerCase() }).exec();
        if (!exists) {
          await UserModel.create({
            id: u.id,
            name: u.name,
            email: u.email.toLowerCase(),
            passwordHash: u.passwordHash,
            role: u.role,
            createdAt: u.createdAt || (/* @__PURE__ */ new Date()).toISOString()
          });
          console.log(`[Migration] Seeded user into MongoDB: ${u.email} (${u.role})`);
        }
      }
    }
    if (localDB.categories && Array.isArray(localDB.categories)) {
      for (const c of localDB.categories) {
        const exists = await CategoryModel.findOne({ id: c.id }).exec();
        if (!exists) {
          await CategoryModel.create(c);
          console.log(`[Migration] Seeded category into MongoDB: ${c.title}`);
        }
      }
    }
    if (localDB.products && Array.isArray(localDB.products)) {
      for (const p of localDB.products) {
        const exists = await ProductModel.findOne({ id: p.id }).exec();
        if (!exists) {
          await ProductModel.create(p);
        }
      }
    }
    if (localDB.settings) {
      const exists = await SettingsModel.findOne({ key: "main" }).exec();
      if (!exists) {
        await SettingsModel.create({
          key: "main",
          appName: localDB.settings.appName || "\u062E\u0644\u064A\u0643\u064A \u062C\u0645\u064A\u0644\u0629",
          adminPin: localDB.settings.adminPin || "1234",
          lastUpdated: localDB.settings.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    if (localDB.notifications && Array.isArray(localDB.notifications)) {
      for (const n of localDB.notifications) {
        const exists = await NotificationModel.findOne({ id: n.id }).exec();
        if (!exists) {
          await NotificationModel.create(n);
        }
      }
    }
    if (localDB.favorites && Array.isArray(localDB.favorites)) {
      for (const f of localDB.favorites) {
        const exists = await FavoriteModel.findOne({ id: f.id }).exec();
        if (!exists) {
          await FavoriteModel.create(f);
        }
      }
    }
    console.log("\u2705 Local data migration/seed to MongoDB completed.");
  } catch (err) {
    console.error("\u26A0\uFE0F Error during local to MongoDB migration:", err);
  }
}

// server/pushService.ts
import webpush from "web-push";
import fs2 from "fs";
import path2 from "path";
var DATA_DIR2 = process.env.VERCEL ? path2.join("/tmp", "data") : path2.join(process.cwd(), "data");
var DB_FILE2 = path2.join(DATA_DIR2, "db.json");
var ADMIN_EMAIL = "dedlek456@gmail.com";
var activeVapidKeys = {
  publicKey: "",
  privateKey: ""
};
function readLocalDB() {
  try {
    if (fs2.existsSync(DB_FILE2)) {
      const raw = fs2.readFileSync(DB_FILE2, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading local DB in pushService:", err);
  }
  return {};
}
function writeLocalDB(data) {
  try {
    fs2.writeFileSync(DB_FILE2, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local DB in pushService:", err);
  }
}
function getVapidPublicKey() {
  return activeVapidKeys.publicKey;
}
async function isEventAlreadyDispatched(eventKey) {
  if (!eventKey) return false;
  if (isMongoConnected()) {
    try {
      const exists = await DispatchedPushModel.findOne({ eventKey }).lean().exec();
      if (exists) return true;
    } catch (err) {
      console.warn("Error checking dispatched push in Mongo:", err);
    }
  }
  const local = readLocalDB();
  const localEvents = local.dispatchedPushEvents || [];
  return localEvents.includes(eventKey);
}
async function markEventDispatched(eventKey, type, relatedId, statusKey) {
  if (!eventKey) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (isMongoConnected()) {
    try {
      await DispatchedPushModel.findOneAndUpdate(
        { eventKey },
        {
          $setOnInsert: {
            eventKey,
            type,
            relatedId: relatedId || "",
            statusKey: statusKey || "",
            createdAt: now
          }
        },
        { upsert: true }
      ).exec();
    } catch (err) {
      console.warn("Error marking dispatched push in Mongo:", err);
    }
  }
  const local = readLocalDB();
  local.dispatchedPushEvents = local.dispatchedPushEvents || [];
  if (!local.dispatchedPushEvents.includes(eventKey)) {
    local.dispatchedPushEvents.push(eventKey);
    if (local.dispatchedPushEvents.length > 1e3) {
      local.dispatchedPushEvents = local.dispatchedPushEvents.slice(-1e3);
    }
    writeLocalDB(local);
  }
}
async function savePushSubscription(params) {
  const { endpoint, keys, userId, userEmail, userRole, platform, fcmToken, notificationsEnabled, userAgent } = params;
  const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : "";
  const isAdmin = userRole === "admin" || cleanEmail === ADMIN_EMAIL;
  const effectiveRole = isAdmin ? "admin" : userRole || "user";
  const effectiveEnabled = isAdmin ? false : notificationsEnabled !== false;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const record = {
    id: "sub-" + Buffer.from(endpoint).toString("base64").substring(0, 24).replace(/[^a-zA-Z0-9]/g, ""),
    userId: userId || "",
    userEmail: cleanEmail,
    userRole: effectiveRole,
    platform: platform || "android",
    endpoint,
    keys,
    fcmToken: fcmToken || "",
    notificationsEnabled: effectiveEnabled,
    userAgent: userAgent || "",
    createdAt: now,
    updatedAt: now
  };
  if (isMongoConnected()) {
    try {
      await PushSubscriptionModel.findOneAndUpdate(
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
      console.warn("Error saving push subscription to MongoDB:", err);
    }
  }
  const local = readLocalDB();
  local.pushSubscriptions = local.pushSubscriptions || [];
  const idx = local.pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
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
  console.log(`\u{1F4F1} Push subscription saved for endpoint (${endpoint.slice(0, 35)}...): User=${record.userId || record.userEmail || "guest"}, Role=${record.userRole}, Enabled=${record.notificationsEnabled}`);
  return record;
}
async function removePushSubscription(endpoint) {
  if (!endpoint) return;
  if (isMongoConnected()) {
    try {
      await PushSubscriptionModel.deleteOne({ endpoint }).exec();
      console.log(`\u{1F5D1}\uFE0F Removed push subscription endpoint from MongoDB (${endpoint.slice(0, 35)}...)`);
    } catch (err) {
      console.warn("Error deleting push subscription from Mongo:", err);
    }
  }
  const local = readLocalDB();
  if (local.pushSubscriptions) {
    local.pushSubscriptions = local.pushSubscriptions.filter(
      (s) => s.endpoint !== endpoint
    );
    writeLocalDB(local);
    console.log(`\u{1F5D1}\uFE0F Removed push subscription endpoint from local DB (${endpoint.slice(0, 35)}...)`);
  }
}
async function updatePushPreferences(userIdentifier, notificationsEnabled) {
  const cleanId = userIdentifier.trim();
  const cleanEmail = cleanId.toLowerCase();
  if (isMongoConnected()) {
    try {
      await PushSubscriptionModel.updateMany(
        {
          $or: [
            { userId: cleanId },
            { userEmail: cleanEmail }
          ],
          userRole: { $ne: "admin" }
          // Never enable push for admin
        },
        {
          $set: {
            notificationsEnabled,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        }
      ).exec();
    } catch (err) {
      console.warn("Error updating push preferences in Mongo:", err);
    }
  }
  const local = readLocalDB();
  if (local.pushSubscriptions) {
    local.pushSubscriptions.forEach((s) => {
      if ((s.userId === cleanId || s.userEmail === cleanEmail) && s.userRole !== "admin") {
        s.notificationsEnabled = notificationsEnabled;
        s.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
    });
    writeLocalDB(local);
  }
}
async function dispatchPushToSubscription(sub, payload) {
  if (sub.userRole === "admin" || sub.userEmail && sub.userEmail.toLowerCase() === ADMIN_EMAIL) {
    console.log(`\u{1F6D1} Skipped sending push to admin device (${sub.endpoint.slice(0, 30)}...).`);
    return false;
  }
  if (sub.notificationsEnabled === false) {
    console.log(`\u{1F6D1} Skipped sending push: notifications disabled for (${sub.endpoint.slice(0, 30)}...).`);
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
      url: payload.url || "/",
      orderId: payload.orderId || "",
      type: payload.type || "general",
      relatedId: payload.relatedId || "",
      statusKey: payload.statusKey || "",
      tag: payload.tag || `notif-${Date.now()}`,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/badge-96.png",
      timestamp: Date.now()
    });
    await webpush.sendNotification(pushSub, pushPayloadString, {
      TTL: 60 * 60 * 24,
      // 24 hours
      urgency: "high"
      // High priority delivery on Android / FCM
    });
    return true;
  } catch (err) {
    const statusCode = err?.statusCode || err?.status;
    if (statusCode === 410 || statusCode === 404) {
      console.log(`\u2139\uFE0F Expired push subscription detected (${sub.endpoint.slice(0, 35)}...). Cleaning up.`);
      await removePushSubscription(sub.endpoint);
    } else {
      console.warn(`\u26A0\uFE0F Push notification failed for endpoint (${sub.endpoint.slice(0, 35)}...):`, err?.message || err);
    }
    return false;
  }
}
async function sendPushToUser(userId, userEmail, payload) {
  try {
    const cleanUserId = (userId || "").trim();
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL) {
      console.log("\u{1F6D1} Target recipient is admin. Skipping push notification.");
      return { sentCount: 0, totalMatched: 0 };
    }
    if (!cleanUserId && !cleanEmail) {
      console.log("\u2139\uFE0F No user identifier provided for targeted push. Skipping.");
      return { sentCount: 0, totalMatched: 0 };
    }
    const eventKey = payload.tag || (payload.orderId && payload.statusKey ? `order-${payload.orderId}-${payload.statusKey}` : "");
    if (eventKey) {
      const alreadySent = await isEventAlreadyDispatched(eventKey);
      if (alreadySent) {
        console.log(`\u2139\uFE0F Push event [${eventKey}] was already dispatched. Skipping duplicate.`);
        return { sentCount: 0, totalMatched: 0 };
      }
    }
    let subscriptions = [];
    if (isMongoConnected()) {
      try {
        const orQuery = [];
        if (cleanUserId) orQuery.push({ userId: cleanUserId });
        if (cleanEmail) orQuery.push({ userEmail: cleanEmail });
        subscriptions = await PushSubscriptionModel.find({
          $or: orQuery,
          userRole: { $ne: "admin" },
          notificationsEnabled: { $ne: false }
        }).lean().exec();
      } catch (err) {
        console.warn("Error fetching subscriptions from Mongo:", err);
      }
    }
    const local = readLocalDB();
    const localSubs = local.pushSubscriptions || [];
    for (const ls of localSubs) {
      const match = cleanUserId && ls.userId === cleanUserId || cleanEmail && ls.userEmail && ls.userEmail.toLowerCase() === cleanEmail;
      if (match && ls.userRole !== "admin" && ls.notificationsEnabled !== false && !subscriptions.some((s) => s.endpoint === ls.endpoint)) {
        subscriptions.push(ls);
      }
    }
    const strictlyFiltered = subscriptions.filter((s) => {
      if (s.userRole === "admin") return false;
      if (s.userEmail && s.userEmail.toLowerCase() === ADMIN_EMAIL) return false;
      if (s.notificationsEnabled === false) return false;
      const isOwner = cleanUserId && s.userId === cleanUserId || cleanEmail && s.userEmail && s.userEmail.toLowerCase() === cleanEmail;
      return isOwner;
    });
    console.log(`\u{1F4F2} Dispatching order status push to user [${cleanUserId || cleanEmail}]: found ${strictlyFiltered.length} registered device(s).`);
    let sentCount = 0;
    for (const sub of strictlyFiltered) {
      const ok = await dispatchPushToSubscription(sub, payload);
      if (ok) sentCount++;
    }
    if (eventKey && sentCount > 0) {
      await markEventDispatched(eventKey, payload.type || "order_status", payload.orderId, payload.statusKey);
    }
    return { sentCount, totalMatched: strictlyFiltered.length };
  } catch (err) {
    console.error("Error sending targeted push to user:", err);
    return { sentCount: 0, totalMatched: 0 };
  }
}
async function broadcastPushNotification(payload) {
  try {
    const eventKey = payload.tag || (payload.relatedId ? `${payload.type}-${payload.relatedId}` : "");
    if (eventKey) {
      const alreadySent = await isEventAlreadyDispatched(eventKey);
      if (alreadySent) {
        console.log(`\u2139\uFE0F Broadcast event [${eventKey}] was already dispatched. Skipping duplicate.`);
        return { sentCount: 0, totalSubscribers: 0 };
      }
    }
    let subscriptions = [];
    if (isMongoConnected()) {
      try {
        subscriptions = await PushSubscriptionModel.find({
          notificationsEnabled: { $ne: false },
          userRole: { $ne: "admin" },
          userEmail: { $ne: ADMIN_EMAIL }
        }).lean().exec();
      } catch (err) {
        console.warn("Error fetching broadcast subscriptions from Mongo:", err);
      }
    }
    const local = readLocalDB();
    const localSubs = local.pushSubscriptions || [];
    for (const ls of localSubs) {
      const isEligible = ls.notificationsEnabled !== false && ls.userRole !== "admin" && (!ls.userEmail || ls.userEmail.toLowerCase() !== ADMIN_EMAIL);
      if (isEligible && !subscriptions.some((s) => s.endpoint === ls.endpoint)) {
        subscriptions.push(ls);
      }
    }
    const filteredSubs = subscriptions.filter(
      (s) => s.userRole !== "admin" && s.userEmail !== ADMIN_EMAIL && s.notificationsEnabled !== false
    );
    console.log(`\u{1F4E2} Broadcasting push notification to ${filteredSubs.length} opted-in user device(s) (Admin excluded).`);
    let sentCount = 0;
    for (const sub of filteredSubs) {
      const ok = await dispatchPushToSubscription(sub, payload);
      if (ok) sentCount++;
    }
    if (eventKey) {
      await markEventDispatched(eventKey, payload.type || "general", payload.relatedId, payload.statusKey);
    }
    return { sentCount, totalSubscribers: filteredSubs.length };
  } catch (err) {
    console.error("Error broadcasting push notification:", err);
    return { sentCount: 0, totalSubscribers: 0 };
  }
}

// server/app.ts
dotenv.config();
var JWT_SECRET = process.env.JWT_SECRET || "open-your-project-secure-jwt-key-2026-xyz";
var DATA_DIR3 = process.env.VERCEL ? path3.join("/tmp", "data") : path3.join(process.cwd(), "data");
var DB_FILE3 = path3.join(DATA_DIR3, "db.json");
try {
  if (!fs3.existsSync(DATA_DIR3)) {
    fs3.mkdirSync(DATA_DIR3, { recursive: true });
  }
} catch (e) {
}
var INITIAL_DB = {
  users: [
    {
      id: "admin-dedlek456",
      name: "\u0627\u0644\u0623\u062F\u0645\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
      email: "dedlek456@gmail.com",
      passwordHash: bcrypt2.hashSync("Admin@2026!", 10),
      role: "admin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  categories: [
    {
      id: "detergents",
      title: "\u0635\u0646\u0627\u0639\u0629 \u0627\u0644\u0645\u0646\u0638\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u0637\u0647\u0631\u0627\u062A",
      subtitle: "\u0627\u0644\u0643\u0644\u0648\u0631\u060C \u0627\u0644\u0635\u0627\u0628\u0648\u0646 \u0627\u0644\u0633\u0627\u0626\u0644\u060C \u0645\u0639\u0637\u0631 \u0627\u0644\u0623\u0631\u0636\u064A\u0627\u062A\u060C \u0627\u0644\u062C\u0644",
      iconName: "Sparkles",
      iconEmoji: "\u{1F9F4}",
      color: "from-blue-600 to-indigo-700",
      bgColor: "bg-blue-900/30",
      borderColor: "border-blue-500/40",
      isAvailable: true,
      badgeText: "\u0645\u062A\u0627\u062D \u0644\u0644\u0628\u062F\u0621 \u0641\u0648\u0631\u0627\u064B",
      description: "\u0645\u0634\u0627\u0631\u064A\u0639 \u062E\u0641\u064A\u0641\u0629 \u0648\u0645\u062A\u0648\u0633\u0637\u0629 \u0644\u0625\u0646\u062A\u0627\u062C \u0648\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0645\u0646\u0638\u0641\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629.",
      order: 1
    }
  ],
  videos: [],
  products: [],
  orders: [],
  notifications: [],
  favorites: [],
  settings: {
    appName: "\u062E\u0644\u064A\u0643\u064A \u062C\u0645\u064A\u0644\u0629",
    adminPin: "1234",
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  }
};
function readDB() {
  try {
    if (!fs3.existsSync(DB_FILE3)) {
      const seedPath = path3.join(process.cwd(), "data", "db.json");
      if (fs3.existsSync(seedPath)) {
        try {
          if (!fs3.existsSync(DATA_DIR3)) {
            fs3.mkdirSync(DATA_DIR3, { recursive: true });
          }
          const seedContent = fs3.readFileSync(seedPath, "utf-8");
          fs3.writeFileSync(DB_FILE3, seedContent, "utf-8");
          return JSON.parse(seedContent);
        } catch (e) {
        }
      }
      try {
        if (!fs3.existsSync(DATA_DIR3)) {
          fs3.mkdirSync(DATA_DIR3, { recursive: true });
        }
        fs3.writeFileSync(DB_FILE3, JSON.stringify(INITIAL_DB, null, 2), "utf-8");
      } catch (e) {
      }
      return INITIAL_DB;
    }
    const data = fs3.readFileSync(DB_FILE3, "utf-8");
    const parsed = JSON.parse(data);
    const hasAdmin = parsed.users && parsed.users.some((u) => u.email === "dedlek456@gmail.com" && u.role === "admin");
    if (!hasAdmin) {
      parsed.users = parsed.users || [];
      parsed.users.unshift(INITIAL_DB.users[0]);
      try {
        fs3.writeFileSync(DB_FILE3, JSON.stringify(parsed, null, 2), "utf-8");
      } catch (e) {
      }
    }
    parsed.notifications = parsed.notifications || [];
    parsed.favorites = parsed.favorites || [];
    return parsed;
  } catch (err) {
    console.error("Error reading DB:", err);
    return INITIAL_DB;
  }
}
function writeDB(data) {
  try {
    if (!fs3.existsSync(DATA_DIR3)) {
      fs3.mkdirSync(DATA_DIR3, { recursive: true });
    }
    data.settings.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    fs3.writeFileSync(DB_FILE3, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}
async function createNotification(params) {
  try {
    const { userId, targetUserEmail, type, title, message, statusKey, relatedId } = params;
    if (type === "order_status" && relatedId && statusKey) {
      if (isMongoConnected()) {
        const existing = await NotificationModel.findOne({
          relatedId,
          statusKey
        }).lean().exec();
        if (existing) return existing;
      } else {
        const db2 = readDB();
        const existing = (db2.notifications || []).find(
          (n) => n.relatedId === relatedId && n.statusKey === statusKey
        );
        if (existing) return existing;
      }
    }
    if ((type === "new_video" || type === "new_category") && relatedId) {
      if (isMongoConnected()) {
        const existing = await NotificationModel.findOne({
          type,
          relatedId
        }).lean().exec();
        if (existing) return existing;
      } else {
        const db2 = readDB();
        const existing = (db2.notifications || []).find(
          (n) => n.type === type && n.relatedId === relatedId
        );
        if (existing) return existing;
      }
    }
    const newNotif = {
      id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId,
      targetUserEmail: targetUserEmail ? targetUserEmail.toLowerCase() : "",
      type,
      title: title.trim(),
      message: message.trim(),
      statusKey: statusKey || "",
      relatedId: relatedId || "",
      readBy: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isMongoConnected()) {
      await NotificationModel.create(newNotif);
    }
    const db = readDB();
    db.notifications = db.notifications || [];
    db.notifications.unshift(newNotif);
    writeDB(db);
    return newNotif;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
}
async function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "\u0645\u0637\u0644\u0648\u0628 \u0631\u0645\u0632 \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 (Token) \u0644\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621" });
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      return res.status(403).json({ error: "\u0631\u0645\u0632 \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" });
    }
    let userRole = decoded.role;
    let userId = decoded.id;
    let userEmail = decoded.email;
    let userName = decoded.name;
    if (isMongoConnected()) {
      try {
        const dbUser = await UserModel.findOne({ id: decoded.id }).exec();
        if (dbUser) {
          userRole = dbUser.role;
          userId = dbUser.id;
          userEmail = dbUser.email;
          userName = dbUser.name;
        }
      } catch (e) {
        console.warn("Error checking user in Mongo:", e);
      }
    } else {
      const db = readDB();
      const dbUser = db.users.find((u) => u.id === decoded.id && u.email === decoded.email);
      if (dbUser) {
        userRole = dbUser.role;
      }
    }
    if (userRole !== "admin") {
      return res.status(403).json({
        error: "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0648\u0635\u0648\u0644: \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0645\u062E\u0635\u0635 \u0644\u0644\u0645\u0634\u0631\u0641 (Admin) \u0641\u0642\u0637 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0639\u0627\u062F\u064A \u062A\u0646\u0641\u064A\u0630\u0647."
      });
    }
    req.user = {
      id: userId,
      email: userEmail,
      role: userRole,
      name: userName
    };
    next();
  });
}
async function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "\u0645\u0637\u0644\u0648\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621" });
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646\u062A\u0647\u064A\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
    }
    let userRole = decoded.role || "user";
    let userId = decoded.id;
    let userEmail = decoded.email;
    let userName = decoded.name;
    if (isMongoConnected()) {
      try {
        const dbUser = await UserModel.findOne({ id: decoded.id }).exec();
        if (dbUser) {
          userRole = dbUser.role;
          userId = dbUser.id;
          userEmail = dbUser.email;
          userName = dbUser.name;
        }
      } catch (e) {
        console.warn("Error checking user in Mongo:", e);
      }
    } else {
      const db = readDB();
      const dbUser = db.users.find((u) => u.id === decoded.id || u.email === decoded.email);
      if (dbUser) {
        userRole = dbUser.role;
        userId = dbUser.id;
        userEmail = dbUser.email;
        userName = dbUser.name;
      }
    }
    req.user = {
      id: userId,
      email: userEmail,
      role: userRole,
      name: userName
    };
    next();
  });
}
async function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next();
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (!err && decoded) {
      let userRole = decoded.role || "user";
      let userId = decoded.id;
      let userEmail = decoded.email;
      let userName = decoded.name;
      if (isMongoConnected()) {
        try {
          const dbUser = await UserModel.findOne({ id: decoded.id }).exec();
          if (dbUser) {
            userRole = dbUser.role;
            userId = dbUser.id;
            userEmail = dbUser.email;
            userName = dbUser.name;
          }
        } catch (e) {
        }
      }
      req.user = {
        id: userId,
        email: userEmail,
        role: userRole,
        name: userName
      };
    }
    next();
  });
}
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && !isMongoConnected()) {
    try {
      await connectMongoDB();
    } catch (e) {
      console.warn("Auto-connect MongoDB warning:", e);
    }
  }
  next();
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || "").toString().trim();
    const password = req.body.password;
    if (!identifier || !password) {
      return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
    }
    const normalizedInput = identifier.toLowerCase();
    const cleanPhone = identifier.replace(/[\s\-\(\)\+]/g, "");
    const isAdminAttempt = normalizedInput === "admin" || normalizedInput === "dedlek456@gmail.com";
    let user = null;
    if (isMongoConnected()) {
      const orConditions = [
        { email: normalizedInput },
        { phone: identifier },
        { id: normalizedInput }
      ];
      if (cleanPhone && cleanPhone !== normalizedInput) {
        orConditions.push({ phone: cleanPhone });
        orConditions.push({ email: cleanPhone });
      }
      if (isAdminAttempt) {
        orConditions.push({ role: "admin" });
      }
      user = await UserModel.findOne({ $or: orConditions }).exec();
    }
    if (!user) {
      const db = readDB();
      user = db.users.find(
        (u) => u.email.toLowerCase() === normalizedInput || cleanPhone && u.email.toLowerCase() === cleanPhone || u.phone && (u.phone === identifier || cleanPhone && u.phone === cleanPhone) || isAdminAttempt && (u.role === "admin" || u.email === "dedlek456@gmail.com")
      );
    }
    if (!user && isAdminAttempt) {
      const newAdminHash = bcrypt2.hashSync("Admin@2026!", 10);
      user = {
        id: "admin-dedlek456",
        name: "\u0627\u0644\u0623\u062F\u0645\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
        email: "dedlek456@gmail.com",
        phone: "",
        passwordHash: newAdminHash,
        role: "admin",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (isMongoConnected()) {
        try {
          await UserModel.create(user);
        } catch (e) {
          console.warn("Could not auto-create admin in Mongo:", e);
        }
      }
      const db = readDB();
      db.users.unshift(user);
      writeDB(db);
    }
    if (!user) {
      return res.status(401).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    }
    let isMatch = false;
    if (user.passwordHash) {
      try {
        isMatch = bcrypt2.compareSync(password, user.passwordHash);
      } catch (e) {
        isMatch = false;
      }
    }
    if (!isMatch) {
      return res.status(401).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    return res.json({
      message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D",
      token,
      database: isMongoConnected() ? "MongoDB Atlas (Cloud)" : "Local JSON",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
  }
});
app.post("/api/auth/admin-reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u064A\u062C\u0628 \u0623\u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 6 \u0623\u062D\u0631\u0641 \u0623\u0648 \u0623\u0631\u0642\u0627\u0645" });
    }
    const adminEmail = (email || "dedlek456@gmail.com").trim().toLowerCase();
    if (adminEmail !== "dedlek456@gmail.com") {
      return res.status(403).json({ error: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0645\u062E\u0635\u0635 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0634\u0631\u0641 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0641\u0642\u0637" });
    }
    const newHash = bcrypt2.hashSync(newPassword, 10);
    let adminUser = null;
    if (isMongoConnected()) {
      const updated = await UserModel.findOneAndUpdate(
        { email: adminEmail, role: "admin" },
        { passwordHash: newHash },
        { new: true }
      ).lean().exec();
      if (updated) {
        adminUser = {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          passwordHash: updated.passwordHash,
          role: "admin",
          createdAt: updated.createdAt
        };
      }
    }
    const db = readDB();
    const localAdmin = db.users.find((u) => u.email.toLowerCase() === adminEmail && u.role === "admin");
    if (localAdmin) {
      localAdmin.passwordHash = newHash;
      writeDB(db);
      if (!adminUser) {
        adminUser = localAdmin;
      }
    }
    if (!adminUser) {
      return res.status(404).json({ error: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0634\u0631\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: "admin", name: adminUser.name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    return res.json({
      message: "\u062A\u0645 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0644\u0644\u0623\u062F\u0645\u0646 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u062D\u062F\u064A\u062B MongoDB",
      token,
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: "admin"
      }
    });
  } catch (err) {
    console.error("Admin reset password error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
  }
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, password } = req.body;
    const identifier = (req.body.identifier || req.body.email || req.body.phone || "").toString().trim();
    if (!name || !identifier || !password) {
      return res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0627\u0633\u0645\u060C \u0648\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641\u060C \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0646 6 \u062E\u0627\u0646\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    }
    const normalizedIdentifier = identifier.toLowerCase();
    const cleanPhone = identifier.replace(/[\s\-\(\)\+]/g, "");
    const isEmail = identifier.includes("@");
    if (isMongoConnected()) {
      const orConditions = [
        { email: normalizedIdentifier },
        { phone: identifier }
      ];
      if (cleanPhone && cleanPhone !== normalizedIdentifier) {
        orConditions.push({ phone: cleanPhone });
        orConditions.push({ email: cleanPhone });
      }
      const existing = await UserModel.findOne({ $or: orConditions }).exec();
      if (existing) {
        return res.status(400).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" });
      }
    }
    const db = readDB();
    const existingLocal = db.users.find(
      (u) => u.email.toLowerCase() === normalizedIdentifier || cleanPhone && u.email.toLowerCase() === cleanPhone || u.phone && (u.phone === identifier || cleanPhone && u.phone === cleanPhone)
    );
    if (existingLocal && !isMongoConnected()) {
      return res.status(400).json({ error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" });
    }
    const newUser = {
      id: "usr-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      name: name.trim(),
      email: normalizedIdentifier,
      phone: isEmail ? "" : identifier,
      passwordHash: bcrypt2.hashSync(password, 10),
      role: "user",
      // NEVER allow 'admin' from registration
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isMongoConnected()) {
      await UserModel.create(newUser);
    }
    db.users.push(newUser);
    writeDB(db);
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone || "",
        role: newUser.role,
        name: newUser.name
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    return res.status(201).json({
      message: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D",
      token,
      database: isMongoConnected() ? "MongoDB Atlas (Cloud)" : "Local JSON",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || "",
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
  }
});
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.json({ user: null, role: "guest" });
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      return res.json({ user: null, role: "guest" });
    }
    if (isMongoConnected()) {
      try {
        const user2 = await UserModel.findOne({ id: decoded.id }).exec();
        if (user2) {
          return res.json({
            user: {
              id: user2.id,
              name: user2.name,
              email: user2.email,
              phone: user2.phone || "",
              role: user2.role
            }
          });
        }
      } catch (e) {
        console.warn("Mongo user lookup error:", e);
      }
    }
    const db = readDB();
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) {
      return res.json({ user: null, role: "guest" });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role
      }
    });
  });
});
app.get("/api/push/vapid-public-key", (req, res) => {
  try {
    const key = getVapidPublicKey();
    res.json({ publicKey: key });
  } catch (err) {
    console.error("Error fetching VAPID public key:", err);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0627\u0645" });
  }
});
app.post("/api/push/subscribe", optionalAuth, async (req, res) => {
  try {
    const { endpoint, keys, notificationsEnabled, userAgent, fcmToken, platform } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
    }
    const userId = req.user ? req.user.id : "";
    const userEmail = req.user ? (req.user.email || "").toLowerCase().trim() : "";
    const userRole = req.user ? req.user.role : "guest";
    const record = await savePushSubscription({
      endpoint,
      keys,
      userId,
      userEmail,
      userRole,
      platform: platform || "android",
      fcmToken,
      notificationsEnabled: userRole === "admin" ? false : notificationsEnabled !== false,
      userAgent: userAgent || req.headers["user-agent"] || ""
    });
    res.status(201).json({
      success: true,
      message: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0625\u0634\u0639\u0627\u0631\u0627\u062A Push \u0628\u0646\u062C\u0627\u062D",
      subscriptionId: record.id
    });
  } catch (err) {
    console.error("Error saving push subscription:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  }
});
app.post("/api/push/logout", optionalAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await removePushSubscription(endpoint);
      console.log(`\u{1F512} Disassociated push endpoint on user logout: ${endpoint.slice(0, 35)}...`);
    }
    res.json({ success: true, message: "\u062A\u0645 \u0641\u0635\u0644 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    console.error("Error in push logout endpoint:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0641\u0635\u0644 \u0627\u0644\u062C\u0647\u0627\u0632" });
  }
});
app.post("/api/push/unsubscribe", optionalAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await removePushSubscription(endpoint);
    }
    res.json({ success: true, message: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  } catch (err) {
    console.error("Error unsubscribing push:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" });
  }
});
app.post("/api/push/preferences", optionalAuth, async (req, res) => {
  try {
    const { notificationsEnabled, endpoint } = req.body;
    const userIdentifier = req.user?.id || req.user?.email || endpoint || "";
    if (userIdentifier) {
      await updatePushPreferences(userIdentifier, notificationsEnabled !== false);
    }
    res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062A\u0641\u0636\u064A\u0644\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  } catch (err) {
    console.error("Error updating push preferences:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" });
  }
});
app.get("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : "";
    let favoriteRecords = [];
    if (isMongoConnected()) {
      const orConditions = [{ userId }];
      if (userEmail) orConditions.push({ userEmail });
      favoriteRecords = await FavoriteModel.find({ $or: orConditions }).lean().exec();
    } else {
      const db = readDB();
      favoriteRecords = (db.favorites || []).filter(
        (f) => f.userId === userId || userEmail && f.userEmail?.toLowerCase() === userEmail
      );
    }
    const favoriteVideoIds = favoriteRecords.map((f) => f.videoId);
    let fullVideos = [];
    if (favoriteVideoIds.length > 0) {
      if (isMongoConnected()) {
        fullVideos = await VideoModel.find({ id: { $in: favoriteVideoIds } }).lean().exec();
      } else {
        const db = readDB();
        fullVideos = (db.videos || []).filter((v) => favoriteVideoIds.includes(v.id));
      }
    }
    res.json({
      success: true,
      favoriteVideoIds,
      favorites: fullVideos
    });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0641\u0636\u0644\u0629" });
  }
});
app.post("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId || typeof videoId !== "string") {
      return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0637\u0644\u0648\u0628" });
    }
    const userId = req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : "";
    const favId = `${userId}_${videoId}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (isMongoConnected()) {
      await FavoriteModel.findOneAndUpdate(
        { userId, videoId },
        {
          $set: {
            id: favId,
            userId,
            userEmail,
            videoId,
            createdAt: now
          }
        },
        { upsert: true, new: true }
      ).exec();
    }
    const db = readDB();
    db.favorites = db.favorites || [];
    const existingIdx = db.favorites.findIndex((f) => f.userId === userId && f.videoId === videoId);
    if (existingIdx === -1) {
      db.favorites.push({
        id: favId,
        userId,
        userEmail,
        videoId,
        createdAt: now
      });
      writeDB(db);
    }
    res.status(201).json({
      success: true,
      message: "\u062A\u0645\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u2764\uFE0F",
      isFavorite: true,
      videoId
    });
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629" });
  }
});
app.delete("/api/favorites/:videoId", authenticateUser, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : "";
    if (isMongoConnected()) {
      const orConditions = [{ userId, videoId }];
      if (userEmail) orConditions.push({ userEmail, videoId });
      await FavoriteModel.deleteMany({ $or: orConditions }).exec();
    }
    const db = readDB();
    if (db.favorites) {
      db.favorites = db.favorites.filter(
        (f) => !(f.videoId === videoId && (f.userId === userId || userEmail && f.userEmail?.toLowerCase() === userEmail))
      );
      writeDB(db);
    }
    res.json({
      success: true,
      message: "\u062A\u0645\u062A \u0627\u0644\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u2661",
      isFavorite: false,
      videoId
    });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0639\u0646\u0635\u0631 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629" });
  }
});
app.post("/api/favorites/toggle", authenticateUser, async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId || typeof videoId !== "string") {
      return res.status(400).json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0637\u0644\u0648\u0628" });
    }
    const userId = req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : "";
    const favId = `${userId}_${videoId}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let exists = false;
    if (isMongoConnected()) {
      const orConditions = [{ userId, videoId }];
      if (userEmail) orConditions.push({ userEmail, videoId });
      const existingRecord = await FavoriteModel.findOne({ $or: orConditions }).lean().exec();
      exists = !!existingRecord;
    } else {
      const db = readDB();
      exists = (db.favorites || []).some(
        (f) => f.videoId === videoId && (f.userId === userId || userEmail && f.userEmail?.toLowerCase() === userEmail)
      );
    }
    if (exists) {
      if (isMongoConnected()) {
        const orConditions = [{ userId, videoId }];
        if (userEmail) orConditions.push({ userEmail, videoId });
        await FavoriteModel.deleteMany({ $or: orConditions }).exec();
      }
      const db = readDB();
      if (db.favorites) {
        db.favorites = db.favorites.filter(
          (f) => !(f.videoId === videoId && (f.userId === userId || userEmail && f.userEmail?.toLowerCase() === userEmail))
        );
        writeDB(db);
      }
      return res.json({
        success: true,
        message: "\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u2661",
        isFavorite: false,
        videoId
      });
    } else {
      if (isMongoConnected()) {
        await FavoriteModel.findOneAndUpdate(
          { userId, videoId },
          {
            $set: {
              id: favId,
              userId,
              userEmail,
              videoId,
              createdAt: now
            }
          },
          { upsert: true, new: true }
        ).exec();
      }
      const db = readDB();
      db.favorites = db.favorites || [];
      db.favorites.push({
        id: favId,
        userId,
        userEmail,
        videoId,
        createdAt: now
      });
      writeDB(db);
      return res.json({
        success: true,
        message: "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u2764\uFE0F",
        isFavorite: true,
        videoId
      });
    }
  } catch (err) {
    console.error("Error toggling favorite:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0641\u0636\u0644\u0629" });
  }
});
app.get("/api/cms/data", async (req, res) => {
  try {
    if (isMongoConnected()) {
      const [categories, videos, products, settings] = await Promise.all([
        CategoryModel.find().sort({ order: 1 }).lean().exec(),
        VideoModel.find().sort({ order: 1 }).lean().exec(),
        ProductModel.find().sort({ order: 1 }).lean().exec(),
        SettingsModel.findOne({ key: "main" }).lean().exec()
      ]);
      return res.json({
        database: "MongoDB Atlas (Cloud)",
        isPermanent: true,
        categories: categories && categories.length > 0 ? categories : INITIAL_DB.categories,
        videos: videos || [],
        products: products || [],
        settings: settings || INITIAL_DB.settings
      });
    }
    const db = readDB();
    res.json({
      database: "Local Backup (data/db.json)",
      isPermanent: false,
      categories: db.categories,
      videos: db.videos,
      products: db.products,
      settings: db.settings
    });
  } catch (err) {
    console.error("Error fetching CMS data:", err);
    const db = readDB();
    res.json({
      categories: db.categories,
      videos: db.videos,
      products: db.products,
      settings: db.settings
    });
  }
});
app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  try {
    const { title, description, iconEmoji, imageUrl, isAvailable, badgeText, order } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
    }
    const newCategory = {
      id: req.body.id || "cat-" + Date.now(),
      title: title.trim(),
      subtitle: req.body.subtitle || "",
      iconName: req.body.iconName || "Sparkles",
      iconEmoji: iconEmoji ? iconEmoji.trim() : "\u{1F9F4}",
      imageUrl: imageUrl ? imageUrl.trim() : "",
      color: req.body.color || "from-purple-600 to-indigo-700",
      bgColor: req.body.bgColor || "bg-purple-900/30",
      borderColor: req.body.borderColor || "border-purple-500/40",
      isAvailable: isAvailable !== false,
      badgeText: badgeText ? badgeText.trim() : isAvailable === false ? "\u0642\u0631\u064A\u0628\u0627\u064B" : "\u0645\u062A\u0627\u062D \u0644\u0644\u0628\u062F\u0621",
      description: description ? description.trim() : "",
      order: order !== void 0 ? Number(order) : Date.now()
    };
    if (isMongoConnected()) {
      await CategoryModel.create(newCategory);
    }
    const db = readDB();
    db.categories.push(newCategory);
    writeDB(db);
    const catNotifTitle = "\u{1F4C2} \u0642\u0633\u0645 \u062C\u062F\u064A\u062F";
    const catNotifMsg = "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645 \u062C\u062F\u064A\u062F \u0641\u064A \u062E\u0644\u064A\u0643\u064A \u062C\u0645\u064A\u0644\u0629 \u2728";
    createNotification({
      userId: "all",
      type: "new_category",
      title: catNotifTitle,
      message: catNotifMsg,
      relatedId: newCategory.id
    }).catch((err) => console.warn("Failed to dispatch category notification:", err));
    broadcastPushNotification({
      title: catNotifTitle,
      message: catNotifMsg,
      url: `/?category=${encodeURIComponent(newCategory.id)}`,
      type: "new_category",
      relatedId: newCategory.id,
      tag: `new-category-${newCategory.id}`
    }).catch((e) => console.warn("Broadcast push error for new category:", e));
    res.status(201).json({
      message: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0633\u0645 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      category: newCategory
    });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u0642\u0633\u0645" });
  }
});
app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, iconEmoji, imageUrl, color, bgColor, borderColor, isAvailable, badgeText, order, subtitle } = req.body;
    const updateData = {};
    if (title !== void 0) updateData.title = title.trim();
    if (description !== void 0) updateData.description = description.trim();
    if (iconEmoji !== void 0) updateData.iconEmoji = iconEmoji.trim();
    if (imageUrl !== void 0) updateData.imageUrl = imageUrl.trim();
    if (color !== void 0) updateData.color = color;
    if (bgColor !== void 0) updateData.bgColor = bgColor;
    if (borderColor !== void 0) updateData.borderColor = borderColor;
    if (isAvailable !== void 0) updateData.isAvailable = isAvailable;
    if (badgeText !== void 0) updateData.badgeText = badgeText.trim();
    if (order !== void 0) updateData.order = Number(order);
    if (subtitle !== void 0) updateData.subtitle = subtitle.trim();
    let updatedCategory = null;
    if (isMongoConnected()) {
      updatedCategory = await CategoryModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean().exec();
    }
    const db = readDB();
    const index = db.categories.findIndex((c) => c.id === id);
    if (index >= 0) {
      db.categories[index] = { ...db.categories[index], ...updateData };
      writeDB(db);
      if (!updatedCategory) updatedCategory = db.categories[index];
    }
    if (!updatedCategory) {
      return res.status(404).json({ error: "\u0627\u0644\u0642\u0633\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0642\u0633\u0645 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      category: updatedCategory
    });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0642\u0633\u0645" });
  }
});
app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      await CategoryModel.deleteOne({ id }).exec();
    }
    const db = readDB();
    db.categories = db.categories.filter((c) => c.id !== id);
    writeDB(db);
    res.json({
      message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0633\u0645 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON"
    });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0642\u0633\u0645" });
  }
});
app.post("/api/admin/videos", requireAdmin, async (req, res) => {
  try {
    const { categoryId, title, usageInstructions, productImages, videoUrl, price, currency, duration, isVisible, isSpecialOffer, specialOfferText } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0631\u0627\u0628\u0637 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const newVideo = {
      id: "vid-" + Date.now(),
      categoryId: categoryId || "detergents",
      title: title.trim(),
      description: req.body.description || "",
      usageInstructions: usageInstructions || "",
      productImages: Array.isArray(productImages) ? productImages : [],
      videoUrl: videoUrl.trim(),
      thumbnailUrl: req.body.thumbnailUrl || "",
      duration: duration || "05:00",
      price: price !== void 0 && price !== "" ? Number(price) : 0,
      currency: currency || "\u062C\u0646\u064A\u0647",
      isSpecialOffer: isSpecialOffer === true || isSpecialOffer === "true",
      specialOfferText: specialOfferText ? specialOfferText.trim() : "\u2715 \u0639\u0631\u0636 \u062E\u0627\u0635",
      order: Date.now(),
      isVisible: isVisible !== false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isMongoConnected()) {
      await VideoModel.create(newVideo);
    }
    const db = readDB();
    db.videos.push(newVideo);
    writeDB(db);
    let catName = "\u0627\u0644\u0623\u0642\u0633\u0627\u0645";
    const cat = db.categories.find((c) => c.id === newVideo.categoryId);
    if (cat && cat.title) {
      catName = cat.title;
    } else if (isMongoConnected()) {
      try {
        const catMongo = await CategoryModel.findOne({ id: newVideo.categoryId }).lean().exec();
        if (catMongo && catMongo.title) catName = catMongo.title;
      } catch (e) {
      }
    }
    const vidNotifTitle = "\u{1F3A5} \u0641\u064A\u062F\u064A\u0648 \u062C\u062F\u064A\u062F";
    const vidNotifMsg = "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0641\u064A\u062F\u064A\u0648 \u062C\u062F\u064A\u062F \u0641\u064A \u062E\u0644\u064A\u0643\u064A \u062C\u0645\u064A\u0644\u0629 \u2728";
    createNotification({
      userId: "all",
      type: "new_video",
      title: vidNotifTitle,
      message: vidNotifMsg,
      relatedId: newVideo.id
    }).catch((err) => console.warn("Failed to dispatch video notification:", err));
    broadcastPushNotification({
      title: vidNotifTitle,
      message: vidNotifMsg,
      url: `/?video=${encodeURIComponent(newVideo.id)}`,
      type: "new_video",
      relatedId: newVideo.id,
      tag: `new-video-${newVideo.id}`
    }).catch((e) => console.warn("Broadcast push error for new video:", e));
    res.status(201).json({
      message: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      video: newVideo
    });
  } catch (err) {
    console.error("Error adding video:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u0641\u064A\u062F\u064A\u0648" });
  }
});
app.put("/api/admin/videos/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoUrl, usageInstructions, productImages, price, currency, isVisible, categoryId, isSpecialOffer, specialOfferText } = req.body;
    const updateData = {};
    if (title !== void 0) updateData.title = title.trim();
    if (videoUrl !== void 0) updateData.videoUrl = videoUrl.trim();
    if (usageInstructions !== void 0) updateData.usageInstructions = usageInstructions;
    if (productImages !== void 0 && Array.isArray(productImages)) updateData.productImages = productImages;
    if (price !== void 0 && price !== "") updateData.price = Number(price);
    if (currency !== void 0) updateData.currency = currency;
    if (isVisible !== void 0) updateData.isVisible = isVisible;
    if (categoryId !== void 0) updateData.categoryId = categoryId;
    if (isSpecialOffer !== void 0) updateData.isSpecialOffer = isSpecialOffer === true || isSpecialOffer === "true";
    if (specialOfferText !== void 0) updateData.specialOfferText = specialOfferText.trim();
    let updatedVideo = null;
    if (isMongoConnected()) {
      updatedVideo = await VideoModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean().exec();
    }
    const db = readDB();
    const index = db.videos.findIndex((v) => v.id === id);
    if (index >= 0) {
      db.videos[index] = { ...db.videos[index], ...updateData };
      writeDB(db);
      if (!updatedVideo) updatedVideo = db.videos[index];
    }
    if (!updatedVideo) {
      return res.status(404).json({ error: "\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      video: updatedVideo
    });
  } catch (err) {
    console.error("Error updating video:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0641\u064A\u062F\u064A\u0648" });
  }
});
app.post("/api/admin/videos/:id/images", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ error: "\u0631\u0627\u0628\u0637 \u0623\u0648 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    let updatedVideo = null;
    if (isMongoConnected()) {
      updatedVideo = await VideoModel.findOneAndUpdate(
        { id },
        { $push: { productImages: imageUrl } },
        { new: true }
      ).lean().exec();
    }
    const db = readDB();
    const vid = db.videos.find((v) => v.id === id);
    if (vid) {
      vid.productImages = vid.productImages || [];
      vid.productImages.push(imageUrl);
      writeDB(db);
      if (!updatedVideo) updatedVideo = vid;
    }
    if (!updatedVideo) {
      return res.status(404).json({ error: "\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({
      message: "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D",
      productImages: updatedVideo.productImages || []
    });
  } catch (err) {
    console.error("Error adding product image:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0635\u0648\u0631\u0629" });
  }
});
app.delete("/api/admin/videos/:id/images", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIndex, imageUrl } = req.body;
    let updatedVideo = null;
    const db = readDB();
    const vid = db.videos.find((v) => v.id === id);
    if (vid && Array.isArray(vid.productImages)) {
      if (imageIndex !== void 0 && imageIndex >= 0 && imageIndex < vid.productImages.length) {
        vid.productImages.splice(imageIndex, 1);
      } else if (imageUrl) {
        vid.productImages = vid.productImages.filter((img) => img !== imageUrl);
      }
      writeDB(db);
      updatedVideo = vid;
    }
    if (isMongoConnected()) {
      if (vid?.productImages) {
        updatedVideo = await VideoModel.findOneAndUpdate(
          { id },
          { $set: { productImages: vid.productImages } },
          { new: true }
        ).lean().exec();
      }
    }
    if (!updatedVideo) {
      return res.status(404).json({ error: "\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({
      message: "\u062A\u0645 \u062D\u0630\u0641 \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D",
      productImages: updatedVideo.productImages || []
    });
  } catch (err) {
    console.error("Error deleting product image:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629" });
  }
});
app.delete("/api/admin/videos/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      await VideoModel.deleteOne({ id }).exec();
    }
    const db = readDB();
    db.videos = db.videos.filter((v) => v.id !== id);
    writeDB(db);
    res.json({
      message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON"
    });
  } catch (err) {
    console.error("Error deleting video:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0641\u064A\u062F\u064A\u0648" });
  }
});
app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u064A\u062C\u0628 \u0623\u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 6 \u0623\u062D\u0631\u0641 \u0623\u0648 \u0623\u0631\u0642\u0627\u0645" });
    }
    const adminEmail = req.user?.email || "dedlek456@gmail.com";
    const newHash = bcrypt2.hashSync(newPassword, 10);
    if (isMongoConnected()) {
      await UserModel.findOneAndUpdate(
        { email: adminEmail, role: "admin" },
        { passwordHash: newHash }
      ).exec();
    }
    const db = readDB();
    const adminUser = db.users.find((u) => u.email === adminEmail && u.role === "admin");
    if (adminUser) {
      adminUser.passwordHash = newHash;
      writeDB(db);
    }
    return res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u0623\u062F\u0645\u0646 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
  } catch (err) {
    console.error("Change admin password error:", err);
    return res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
  }
});
app.put("/api/admin/cms", requireAdmin, async (req, res) => {
  try {
    const { categories, videos, products, settings } = req.body;
    if (isMongoConnected()) {
      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          await CategoryModel.findOneAndUpdate({ id: cat.id }, cat, { upsert: true }).exec();
        }
      }
      if (videos && Array.isArray(videos)) {
        const videoIds = videos.map((v) => v.id).filter(Boolean);
        await VideoModel.deleteMany({ id: { $nin: videoIds } }).exec();
        for (const vid of videos) {
          await VideoModel.findOneAndUpdate({ id: vid.id }, vid, { upsert: true }).exec();
        }
      }
      if (products && Array.isArray(products)) {
        for (const prod of products) {
          await ProductModel.findOneAndUpdate({ id: prod.id }, prod, { upsert: true }).exec();
        }
      }
      if (settings) {
        await SettingsModel.findOneAndUpdate(
          { key: "main" },
          { ...settings, key: "main", lastUpdated: (/* @__PURE__ */ new Date()).toISOString() },
          { upsert: true }
        ).exec();
      }
    }
    const db = readDB();
    if (categories) db.categories = categories;
    if (videos) db.videos = videos;
    if (products) db.products = products;
    if (settings) db.settings = { ...db.settings, ...settings };
    writeDB(db);
    res.json({
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON"
    });
  } catch (err) {
    console.error("Error updating CMS:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A" });
  }
});
function normalizeOrderStatus(status) {
  const s = (status || "").trim().toLowerCase();
  if (s === "confirmed" || s === "\u062A\u0645 \u0627\u0644\u062A\u0623\u0643\u064A\u062F" || s === "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628" || s === "\u0645\u0624\u0643\u062F") return "confirmed";
  if (s === "preparing" || s === "\u062A\u0645 \u0627\u0644\u062A\u062C\u0647\u064A\u0632" || s === "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062C\u0647\u064A\u0632" || s === "\u0642\u064A\u062F \u0627\u0644\u062A\u062C\u0647\u064A\u0632") return "preparing";
  if (s === "delivered" || s === "\u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645" || s === "\u0645\u0643\u062A\u0645\u0644" || s === "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644") return "delivered";
  if (s === "cancelled" || s === "canceled" || s === "\u0645\u0644\u063A\u064A" || s === "\u062A\u0645 \u0627\u0644\u0625\u0644\u063A\u0627\u0621") return "cancelled";
  if (s === "rejected" || s === "\u0645\u0631\u0641\u0648\u0636") return "rejected";
  return "pending";
}
app.post("/api/orders", optionalAuth, async (req, res) => {
  try {
    const order = req.body;
    const userId = req.user?.id || order.userId || "";
    const userEmail = req.user?.email || order.userEmail || "";
    let userName = order.userName || req.user?.name || "";
    let userPhone = order.userPhone || req.user?.phone || "";
    let userAddress = order.userAddress || "";
    if (order.description) {
      if (!userName) {
        const nameMatch = order.description.match(/الاسم:\s*([^|\n\r]+)/);
        if (nameMatch) userName = nameMatch[1].trim();
      }
      if (!userPhone) {
        const phoneMatch = order.description.match(/الهاتف:\s*([0-9+]+)/);
        if (phoneMatch) userPhone = phoneMatch[1].trim();
      }
      if (!userAddress) {
        const addressMatch = order.description.match(/العنوان:\s*([^|\n\r]+)/);
        if (addressMatch) userAddress = addressMatch[1].trim();
      }
    }
    const quantity = order.quantity ? Number(order.quantity) : order.itemsCount ? Number(order.itemsCount) : 1;
    const unitPrice = order.unitPrice !== void 0 && order.unitPrice !== null ? order.unitPrice : order.price ? String(order.price).replace(/جنيه/g, "").trim() : "0";
    const totalPrice = order.totalPrice !== void 0 && order.totalPrice !== null ? order.totalPrice : order.price ? String(order.price).replace(/جنيه/g, "").trim() : "0";
    const cleanPrice = String(totalPrice).replace(/جنيه/g, "").trim();
    const rawStatus = order.status || "pending";
    const status = normalizeOrderStatus(rawStatus);
    const newOrder = {
      id: order.id || "ord-" + Date.now(),
      orderNumber: order.orderNumber || "#" + Math.floor(1e5 + Math.random() * 9e5),
      userId,
      userEmail,
      userName,
      userPhone,
      userAddress,
      title: order.title || "\u0637\u0644\u0628 \u0645\u0646\u062A\u062C",
      type: order.type || "\u0645\u0633\u062A\u062D\u0636\u0631\u0627\u062A \u062A\u062C\u0645\u064A\u0644",
      quantity,
      itemsCount: quantity,
      unitPrice,
      totalPrice,
      price: `${cleanPrice} \u062C\u0646\u064A\u0647`,
      description: order.description || "",
      date: order.date || (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG"),
      status,
      cancelledBy: "",
      cancelledAt: "",
      cancelReason: "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isMongoConnected()) {
      await OrderModel.create(newOrder);
    }
    const db = readDB();
    db.orders.unshift(newOrder);
    writeDB(db);
    if (newOrder.userId || newOrder.userEmail) {
      const orderNotifTitle = "\u{1F4E6} \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u0643";
      const orderNotifMsg = `\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u0643 (${newOrder.title}) \u0628\u0631\u0642\u0645 ${newOrder.orderNumber} \u0628\u0646\u062C\u0627\u062D. \u0637\u0644\u0628\u0643 \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u062D\u0627\u0644\u064A\u0627\u064B.`;
      createNotification({
        userId: newOrder.userId || "guest",
        targetUserEmail: newOrder.userEmail,
        type: "order_status",
        statusKey: "pending",
        title: orderNotifTitle,
        message: orderNotifMsg,
        relatedId: newOrder.id
      }).catch((err) => console.warn("Failed to dispatch order notification:", err));
      sendPushToUser(
        newOrder.userId,
        newOrder.userEmail,
        {
          title: orderNotifTitle,
          message: orderNotifMsg,
          url: `/?tab=orders&orderId=${encodeURIComponent(newOrder.id)}`,
          orderId: newOrder.id,
          type: "order_status",
          statusKey: "pending",
          tag: `order-${newOrder.id}-pending`
        }
      ).catch((err) => console.warn("Failed to dispatch order push notification:", err));
    }
    res.status(201).json({
      message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D",
      database: isMongoConnected() ? "MongoDB Atlas" : "Local JSON",
      order: newOrder
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.get("/api/orders", authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role === "admin") {
      if (isMongoConnected()) {
        const orders = await OrderModel.find().sort({ createdAt: -1 }).lean().exec();
        return res.json(orders);
      }
      const db2 = readDB();
      return res.json(db2.orders || []);
    }
    if (isMongoConnected()) {
      const orConditions = [];
      if (currentUser.id) orConditions.push({ userId: currentUser.id });
      if (currentUser.email) orConditions.push({ userEmail: currentUser.email });
      if (orConditions.length === 0) {
        return res.json([]);
      }
      const userOrders2 = await OrderModel.find({ $or: orConditions }).sort({ createdAt: -1 }).lean().exec();
      return res.json(userOrders2);
    }
    const db = readDB();
    const userOrders = (db.orders || []).filter(
      (o) => currentUser.id && o.userId === currentUser.id || currentUser.email && o.userEmail === currentUser.email
    );
    res.json(userOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0637\u0644\u0628\u0627\u062A" });
  }
});
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    let rawOrders = [];
    if (isMongoConnected()) {
      rawOrders = await OrderModel.find().sort({ createdAt: -1 }).lean().exec();
    } else {
      const db = readDB();
      rawOrders = db.orders || [];
    }
    const formattedOrders = rawOrders.map((order) => {
      let userName = order.userName || "";
      let userPhone = order.userPhone || "";
      let userAddress = order.userAddress || "";
      if (order.description) {
        if (!userName) {
          const nameMatch = order.description.match(/الاسم:\s*([^|\n\r]+)/);
          if (nameMatch) userName = nameMatch[1].trim();
        }
        if (!userPhone) {
          const phoneMatch = order.description.match(/الهاتف:\s*([0-9+]+)/);
          if (phoneMatch) userPhone = phoneMatch[1].trim();
        }
        if (!userAddress) {
          const addressMatch = order.description.match(/العنوان:\s*([^|\n\r]+)/);
          if (addressMatch) userAddress = addressMatch[1].trim();
        }
      }
      const quantity = order.quantity || order.itemsCount || 1;
      const unitPrice = order.unitPrice !== void 0 && order.unitPrice !== null ? order.unitPrice : order.price;
      const totalPrice = order.totalPrice !== void 0 && order.totalPrice !== null ? order.totalPrice : order.price;
      return {
        ...order,
        userName,
        userPhone,
        userAddress,
        quantity,
        itemsCount: quantity,
        unitPrice,
        totalPrice
      };
    });
    res.json(formattedOrders);
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0641" });
  }
});
app.get("/api/orders/:id", authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    const orderId = req.params.id;
    let order = null;
    if (isMongoConnected()) {
      order = await OrderModel.findOne({ id: orderId }).lean().exec();
    } else {
      const db = readDB();
      order = db.orders.find((o) => o.id === orderId);
    }
    if (!order) {
      return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    if (currentUser.role !== "admin" && order.userId !== currentUser.id && order.userEmail !== currentUser.email) {
      return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
    }
    res.json(order);
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628" });
  }
});
var handleAdminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelledBy: reqCancelledBy, cancelReason } = req.body;
    const normalizedStatus = normalizeOrderStatus(status);
    let previousStatus = "";
    const db = readDB();
    const existingLocal = db.orders.find((o) => o.id === id);
    if (existingLocal) previousStatus = existingLocal.status;
    if (isMongoConnected()) {
      const existingMongo = await OrderModel.findOne({ id }).lean().exec();
      if (existingMongo) previousStatus = existingMongo.status;
    }
    let cancelledBy = reqCancelledBy || "";
    let cancelledAt = "";
    if (normalizedStatus === "cancelled" || normalizedStatus === "rejected") {
      cancelledBy = cancelledBy || "admin";
      cancelledAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    const updateFields = { status: normalizedStatus };
    if (normalizedStatus === "cancelled" || normalizedStatus === "rejected") {
      updateFields.cancelledBy = cancelledBy;
      updateFields.cancelledAt = cancelledAt;
      if (cancelReason) updateFields.cancelReason = cancelReason;
    } else {
      updateFields.cancelledBy = "";
      updateFields.cancelledAt = "";
    }
    let updatedOrder = null;
    if (isMongoConnected()) {
      updatedOrder = await OrderModel.findOneAndUpdate(
        { id },
        { $set: updateFields },
        { new: true }
      ).lean().exec();
    }
    const ord = db.orders.find((o) => o.id === id);
    if (ord) {
      Object.assign(ord, updateFields);
      writeDB(db);
      if (!updatedOrder) updatedOrder = ord;
    }
    if (!updatedOrder) {
      return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    if (previousStatus !== normalizedStatus && (updatedOrder.userId || updatedOrder.userEmail)) {
      const orderNum = (updatedOrder.orderNumber || updatedOrder.id || "").replace(/^#/, "");
      const statusNotifMap = {
        pending: {
          title: "\u{1F7E1} \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
          message: `\u0637\u0644\u0628\u0643 \u0631\u0642\u0645 #${orderNum} \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0622\u0646 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629`
        },
        confirmed: {
          title: "\u{1F535} \u062A\u0645 \u0627\u0644\u062A\u0623\u0643\u064A\u062F",
          message: `\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 #${orderNum} \u0648\u064A\u0645\u0643\u0646\u0646\u0627 \u0627\u0644\u0628\u062F\u0621 \u0641\u064A \u062A\u062C\u0647\u064A\u0632\u0647`
        },
        preparing: {
          title: "\u{1F7E0} \u0642\u064A\u062F \u0627\u0644\u062A\u062C\u0647\u064A\u0632",
          message: `\u0628\u062F\u0623\u0646\u0627 \u0641\u064A \u062A\u062C\u0647\u064A\u0632 \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 #${orderNum} \u0648\u0633\u0646\u0648\u0627\u0641\u064A\u0643 \u0628\u0627\u0644\u062C\u062F\u064A\u062F`
        },
        delivered: {
          title: "\u{1F7E2} \u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645",
          message: `\u062A\u0645 \u062A\u0633\u0644\u064A\u0645 \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 #${orderNum} \u0634\u0643\u0631\u064B\u0627 \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627!`
        },
        rejected: {
          title: "\u{1F534} \u062A\u0645 \u0627\u0644\u0631\u0641\u0636",
          message: `\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628 \u0631\u0642\u0645 #${orderNum} \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0645\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628`
        },
        cancelled: {
          title: "\u{1F534} \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628",
          message: `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0631\u0642\u0645 #${orderNum} \u0628\u0648\u0627\u0633\u0637\u0629 ${cancelledBy === "user" ? "\u0627\u0644\u0639\u0645\u064A\u0644" : "\u0627\u0644\u0625\u062F\u0627\u0631\u0629"}`
        }
      };
      const notifInfo = statusNotifMap[normalizedStatus] || {
        title: `\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0637\u0644\u0628\u0643 #${orderNum}`,
        message: `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0637\u0644\u0628\u0643 \u0625\u0644\u0649: ${normalizedStatus}`
      };
      createNotification({
        userId: updatedOrder.userId || "guest",
        targetUserEmail: updatedOrder.userEmail,
        type: "order_status",
        statusKey: normalizedStatus,
        title: notifInfo.title,
        message: notifInfo.message,
        relatedId: updatedOrder.id
      }).catch((err) => console.warn("Failed to send order status notification:", err));
      sendPushToUser(
        updatedOrder.userId,
        updatedOrder.userEmail,
        {
          title: notifInfo.title,
          message: notifInfo.message,
          url: `/?order=${encodeURIComponent(updatedOrder.id)}`,
          orderId: updatedOrder.id,
          type: "order_status",
          statusKey: normalizedStatus,
          tag: `order-${updatedOrder.id}-${normalizedStatus}`
        }
      ).catch((err) => console.warn("Failed to dispatch Android push notification:", err));
    }
    res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0637\u0644\u0628" });
  }
};
app.put("/api/admin/orders/:id/status", requireAdmin, handleAdminUpdateOrderStatus);
app.patch("/api/admin/orders/:id/status", requireAdmin, handleAdminUpdateOrderStatus);
app.put("/api/admin/orders/:id", requireAdmin, handleAdminUpdateOrderStatus);
app.post("/api/orders/:id/cancel", authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    const orderId = req.params.id;
    let order = null;
    if (isMongoConnected()) {
      order = await OrderModel.findOne({ id: orderId }).lean().exec();
    } else {
      const db2 = readDB();
      order = db2.orders.find((o) => o.id === orderId);
    }
    if (!order) {
      return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const isOwner = currentUser.id && order.userId === currentUser.id || currentUser.email && order.userEmail && currentUser.email.toLowerCase() === order.userEmail.toLowerCase();
    if (currentUser.role !== "admin" && !isOwner) {
      return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0625\u0644\u063A\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
    }
    const currentNorm = normalizeOrderStatus(order.status);
    if (currentNorm === "cancelled" || currentNorm === "rejected" || order.cancelledBy) {
      return res.status(400).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u0645\u0644\u063A\u064A \u0628\u0627\u0644\u0641\u0639\u0644 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0644\u063A\u0627\u0624\u0647 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649" });
    }
    if (currentUser.role !== "admin") {
      if (currentNorm !== "pending") {
        return res.status(400).json({
          error: '\u0639\u0630\u0631\u0627\u064B\u060C \u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0627 \u0639\u0646\u062F\u0645\u0627 \u062A\u0643\u0648\u0646 \u062D\u0627\u0644\u062A\u0647 "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629". \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0623\u0648 \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0637\u0644\u0628 \u0628\u0627\u0644\u0641\u0639\u0644.'
        });
      }
    } else {
      if (currentNorm === "delivered") {
        return res.status(400).json({ error: "\u0639\u0630\u0631\u0627\u064B\u060C \u0627\u0644\u0637\u0644\u0628 \u062A\u0645 \u062A\u0633\u0644\u064A\u0645\u0647 \u0628\u0627\u0644\u0641\u0639\u0644 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0644\u063A\u0627\u0624\u0647" });
      }
    }
    const cancelledBy = currentUser.role === "admin" ? "admin" : "user";
    const cancelledAt = (/* @__PURE__ */ new Date()).toISOString();
    const newStatus = "cancelled";
    const updateFields = {
      status: newStatus,
      cancelledBy,
      cancelledAt
    };
    let updatedOrder = null;
    if (isMongoConnected()) {
      updatedOrder = await OrderModel.findOneAndUpdate(
        { id: orderId },
        { $set: updateFields },
        { new: true }
      ).lean().exec();
    }
    const db = readDB();
    const ord = db.orders.find((o) => o.id === orderId);
    if (ord) {
      Object.assign(ord, updateFields);
      writeDB(db);
      if (!updatedOrder) updatedOrder = ord;
    }
    if (!updatedOrder) {
      return res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628" });
    }
    if (updatedOrder.userId || updatedOrder.userEmail) {
      const orderNum = (updatedOrder.orderNumber || updatedOrder.id || "").replace(/^#/, "");
      createNotification({
        userId: updatedOrder.userId || "guest",
        targetUserEmail: updatedOrder.userEmail,
        type: "order_status",
        statusKey: "cancelled",
        title: "\u274C \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628",
        message: `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 #${orderNum} \u0628\u0646\u062C\u0627\u062D.`,
        relatedId: updatedOrder.id
      }).catch((err) => console.warn("Failed to dispatch cancel notification:", err));
    }
    res.json({
      message: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D",
      order: updatedOrder
    });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0646\u0641\u064A\u0630 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.delete("/api/orders/:id", authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    const orderId = req.params.id;
    let order = null;
    if (isMongoConnected()) {
      order = await OrderModel.findOne({ id: orderId }).lean().exec();
    } else {
      const db2 = readDB();
      order = db2.orders.find((o) => o.id === orderId);
    }
    if (!order) {
      return res.status(404).json({ error: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const isOwner = currentUser.id && order.userId === currentUser.id || currentUser.email && order.userEmail && currentUser.email.toLowerCase() === order.userEmail.toLowerCase();
    if (currentUser.role !== "admin" && !isOwner) {
      return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062D\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
    }
    if (isMongoConnected()) {
      await OrderModel.deleteOne({ id: orderId }).exec();
    }
    const db = readDB();
    db.orders = (db.orders || []).filter((o) => o.id !== orderId);
    writeDB(db);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D", orderId });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.delete("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    if (isMongoConnected()) {
      await OrderModel.deleteOne({ id: orderId }).exec();
    }
    const db = readDB();
    db.orders = (db.orders || []).filter((o) => o.id !== orderId);
    writeDB(db);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u062F\u0645\u0646", orderId });
  } catch (err) {
    console.error("Error deleting admin order:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.get("/api/notifications", optionalAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    const includeGeneral = req.query.includeGeneral !== "false";
    let allNotifs = [];
    if (isMongoConnected()) {
      allNotifs = await NotificationModel.find().sort({ createdAt: -1 }).limit(100).lean().exec();
    } else {
      const db = readDB();
      allNotifs = db.notifications || [];
    }
    const userIdentifier = currentUser?.id || "";
    const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : "";
    const filtered = allNotifs.filter((n) => {
      const isCleared = Array.isArray(n.clearedBy) && (userIdentifier && n.clearedBy.includes(userIdentifier) || userEmail && n.clearedBy.includes(userEmail) || !userIdentifier && n.clearedBy.includes("guest"));
      if (isCleared) return false;
      if (n.userId === "all") {
        return includeGeneral;
      }
      if (userIdentifier && n.userId === userIdentifier) return true;
      if (userEmail && n.targetUserEmail && n.targetUserEmail.toLowerCase() === userEmail) return true;
      return false;
    });
    const result = filtered.map((n) => {
      const isRead = Array.isArray(n.readBy) && (userIdentifier && n.readBy.includes(userIdentifier) || userEmail && n.readBy.includes(userEmail) || !userIdentifier && n.readBy.includes("guest"));
      return {
        ...n,
        isRead: !!isRead
      };
    });
    const unreadCount = result.filter((n) => !n.isRead).length;
    res.json({
      notifications: result,
      unreadCount
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  }
});
app.post("/api/notifications/:id/read", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const readerId = currentUser?.id || currentUser?.email || "guest";
    if (isMongoConnected()) {
      await NotificationModel.findOneAndUpdate(
        { id },
        { $addToSet: { readBy: readerId } }
      ).exec();
    }
    const db = readDB();
    const notif = (db.notifications || []).find((n) => n.id === id);
    if (notif) {
      notif.readBy = notif.readBy || [];
      if (!notif.readBy.includes(readerId)) {
        notif.readBy.push(readerId);
      }
      writeDB(db);
    }
    res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
  }
});
app.post("/api/notifications/read-all", optionalAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    const readerId = currentUser?.id || currentUser?.email || "guest";
    const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : "";
    if (isMongoConnected()) {
      const conditions = [{ userId: "all" }];
      if (currentUser?.id) conditions.push({ userId: currentUser.id });
      if (userEmail) conditions.push({ targetUserEmail: userEmail });
      await NotificationModel.updateMany(
        { $or: conditions },
        { $addToSet: { readBy: readerId } }
      ).exec();
    }
    const db = readDB();
    db.notifications = db.notifications || [];
    for (const notif of db.notifications) {
      const isRelevant = notif.userId === "all" || currentUser?.id && notif.userId === currentUser.id || userEmail && notif.targetUserEmail?.toLowerCase() === userEmail;
      if (isRelevant) {
        notif.readBy = notif.readBy || [];
        if (!notif.readBy.includes(readerId)) {
          notif.readBy.push(readerId);
        }
      }
    }
    writeDB(db);
    res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0643\u0645\u0642\u0631\u0648\u0621\u0629" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  }
});
app.post("/api/notifications/clear", optionalAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    const userIdentifier = currentUser?.id || currentUser?.email || "guest";
    const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : "";
    if (isMongoConnected()) {
      await NotificationModel.updateMany(
        {},
        { $addToSet: { clearedBy: userIdentifier } }
      ).exec();
      if (userEmail && userEmail !== userIdentifier) {
        await NotificationModel.updateMany(
          {},
          { $addToSet: { clearedBy: userEmail } }
        ).exec();
      }
    }
    const db = readDB();
    db.notifications = db.notifications || [];
    for (const notif of db.notifications) {
      notif.clearedBy = notif.clearedBy || [];
      if (!notif.clearedBy.includes(userIdentifier)) {
        notif.clearedBy.push(userIdentifier);
      }
      if (userEmail && !notif.clearedBy.includes(userEmail)) {
        notif.clearedBy.push(userEmail);
      }
    }
    writeDB(db);
    res.json({ success: true, message: "\u062A\u0645 \u0645\u0633\u062D \u0625\u0634\u0639\u0627\u0631\u0627\u062A\u0643 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0645\u0633\u062D \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  }
});
app.delete("/api/notifications", optionalAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    const userIdentifier = currentUser?.id || currentUser?.email || "guest";
    const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : "";
    if (isMongoConnected()) {
      await NotificationModel.updateMany(
        {},
        { $addToSet: { clearedBy: userIdentifier } }
      ).exec();
      if (userEmail && userEmail !== userIdentifier) {
        await NotificationModel.updateMany(
          {},
          { $addToSet: { clearedBy: userEmail } }
        ).exec();
      }
    }
    const db = readDB();
    db.notifications = db.notifications || [];
    for (const notif of db.notifications) {
      notif.clearedBy = notif.clearedBy || [];
      if (!notif.clearedBy.includes(userIdentifier)) {
        notif.clearedBy.push(userIdentifier);
      }
      if (userEmail && !notif.clearedBy.includes(userEmail)) {
        notif.clearedBy.push(userEmail);
      }
    }
    writeDB(db);
    res.json({ success: true, message: "\u062A\u0645 \u0645\u0633\u062D \u0625\u0634\u0639\u0627\u0631\u0627\u062A\u0643 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    console.error("Error clearing notifications via DELETE:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u0641\u064A \u0645\u0633\u062D \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
  }
});
app.delete("/api/notifications/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      await NotificationModel.deleteOne({ id }).exec();
    }
    const db = readDB();
    if (db.notifications) {
      db.notifications = db.notifications.filter((n) => n.id !== id);
      writeDB(db);
    }
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isMongoConnected() ? "MongoDB Atlas (Connected & Permanent)" : "Local JSON Fallback",
    isMongoConnected: isMongoConnected(),
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var app_default = app;

// server/vercel.ts
var vercel_default = app_default;
export {
  app_default as app,
  vercel_default as default,
  app_default as handler
};
