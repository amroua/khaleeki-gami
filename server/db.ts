import mongoose, { Schema, Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// --- Types ---
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface CategoryRecord {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  iconEmoji?: string;
  imageUrl?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  isAvailable: boolean;
  badgeText?: string;
  description?: string;
  order: number;
}

export interface VideoRecord {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  usageInstructions?: string;
  productImages?: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  price: number;
  currency: string;
  isSpecialOffer?: boolean;
  specialOfferText?: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
}

export interface ProductRecord {
  id: string;
  categoryId: string;
  name: string;
  volumeOrWeight: string;
  productionCost: number;
  sellingPrice: number;
  profitMargin?: string;
  isSpecialOffer?: boolean;
  specialOfferText?: string;
  isVisible: boolean;
  order: number;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userAddress?: string;
  orderNumber: string;
  title: string;
  type?: string;
  quantity?: number;
  itemsCount?: number;
  unitPrice?: number | string;
  totalPrice?: number | string;
  price: string;
  date: string;
  status: string;
  description?: string;
  cancelledBy?: 'user' | 'admin' | string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface SettingsRecord {
  key: string;
  appName: string;
  adminPin: string;
  lastUpdated: string;
  vapidPublicKey?: string;
  vapidPrivateKey?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userRole?: 'admin' | 'user' | 'guest';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  fcmToken?: string;
  platform?: string; // 'android' | 'web' | 'ios'
  notificationsEnabled: boolean;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchedPushRecord {
  eventKey: string; // Unique key e.g. order-ord123-confirmed or video-vid456
  type: string;
  relatedId?: string;
  statusKey?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string; // 'all' for general notifications, or specific user id
  targetUserEmail?: string;
  type: 'order_status' | 'new_video' | 'new_category' | 'offer' | 'general';
  title: string;
  message: string;
  statusKey?: string; // 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'rejected'
  relatedId?: string;
  readBy: string[];
  clearedBy?: string[];
  createdAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  userEmail?: string;
  videoId: string;
  createdAt: string;
}

// --- Schemas ---
const UserSchema = new Schema<UserRecord>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const CategorySchema = new Schema<CategoryRecord>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  iconName: { type: String, default: 'Sparkles' },
  iconEmoji: { type: String, default: '🧴' },
  imageUrl: { type: String, default: '' },
  color: { type: String, default: 'rose-gold' },
  bgColor: { type: String, default: 'bg-rose-900/30' },
  borderColor: { type: String, default: 'border-rose-500/40' },
  isAvailable: { type: Boolean, default: true },
  badgeText: { type: String, default: '' },
  description: { type: String, default: '' },
  order: { type: Number, default: 1 }
});

const VideoSchema = new Schema<VideoRecord>({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  usageInstructions: { type: String, default: '' },
  productImages: { type: [String], default: [] },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  duration: { type: String, default: '05:00' },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'جنيه' },
  isSpecialOffer: { type: Boolean, default: false },
  specialOfferText: { type: String, default: '✕ عرض خاص' },
  order: { type: Number, default: 1 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ProductSchema = new Schema<ProductRecord>({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  volumeOrWeight: { type: String, default: '1 لتر' },
  productionCost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  profitMargin: { type: String, default: '0%' },
  isSpecialOffer: { type: Boolean, default: false },
  specialOfferText: { type: String, default: '✕ عرض خاص' },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 1 },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const OrderSchema = new Schema<OrderRecord>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '', index: true },
  userEmail: { type: String, default: '' },
  userName: { type: String, default: '' },
  userPhone: { type: String, default: '' },
  userAddress: { type: String, default: '' },
  orderNumber: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'مستحضرات تجميل' },
  quantity: { type: Number, default: 1 },
  itemsCount: { type: Number, default: 1 },
  unitPrice: { type: Schema.Types.Mixed, default: '0' },
  totalPrice: { type: Schema.Types.Mixed, default: '0' },
  price: { type: String, default: '0 جنيه' },
  date: { type: String, default: () => new Date().toLocaleDateString('ar-EG') },
  status: { type: String, default: 'قيد المراجعة' },
  description: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  cancelledAt: { type: String, default: '' },
  cancelReason: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const SettingsSchema = new Schema<SettingsRecord>({
  key: { type: String, required: true, unique: true, default: 'main' },
  appName: { type: String, default: 'خليكي جميلة' },
  adminPin: { type: String, default: '1234' },
  lastUpdated: { type: String, default: () => new Date().toISOString() },
  vapidPublicKey: { type: String, default: '' },
  vapidPrivateKey: { type: String, default: '' }
});

const NotificationSchema = new Schema<NotificationRecord>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  targetUserEmail: { type: String, default: '' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  statusKey: { type: String, default: '' },
  relatedId: { type: String, default: '' },
  readBy: { type: [String], default: [] },
  clearedBy: { type: [String], default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const PushSubscriptionSchema = new Schema<PushSubscriptionRecord>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '', index: true },
  userEmail: { type: String, default: '', index: true },
  userRole: { type: String, default: 'user', index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  fcmToken: { type: String, default: '' },
  platform: { type: String, default: 'android' },
  notificationsEnabled: { type: Boolean, default: true },
  userAgent: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const DispatchedPushSchema = new Schema<DispatchedPushRecord>({
  eventKey: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  relatedId: { type: String, default: '' },
  statusKey: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const FavoriteSchema = new Schema<FavoriteRecord>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, default: '', index: true },
  videoId: { type: String, required: true, index: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
FavoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Models using mongoose
export const UserModel: Model<UserRecord> = mongoose.models.User || mongoose.model<UserRecord>('User', UserSchema);
export const CategoryModel: Model<CategoryRecord> = mongoose.models.Category || mongoose.model<CategoryRecord>('Category', CategorySchema);
export const VideoModel: Model<VideoRecord> = mongoose.models.Video || mongoose.model<VideoRecord>('Video', VideoSchema);
export const ProductModel: Model<ProductRecord> = mongoose.models.Product || mongoose.model<ProductRecord>('Product', ProductSchema);
export const OrderModel: Model<OrderRecord> = mongoose.models.Order || mongoose.model<OrderRecord>('Order', OrderSchema);
export const SettingsModel: Model<SettingsRecord> = mongoose.models.Settings || mongoose.model<SettingsRecord>('Settings', SettingsSchema);
export const NotificationModel: Model<NotificationRecord> = mongoose.models.Notification || mongoose.model<NotificationRecord>('Notification', NotificationSchema);
export const PushSubscriptionModel: Model<PushSubscriptionRecord> = mongoose.models.PushSubscription || mongoose.model<PushSubscriptionRecord>('PushSubscription', PushSubscriptionSchema);
export const DispatchedPushModel: Model<DispatchedPushRecord> = mongoose.models.DispatchedPush || mongoose.model<DispatchedPushRecord>('DispatchedPush', DispatchedPushSchema);
export const FavoriteModel: Model<FavoriteRecord> = mongoose.models.Favorite || mongoose.model<FavoriteRecord>('Favorite', FavoriteSchema);

let isConnected = false;

export async function connectMongoDB(uri?: string): Promise<boolean> {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('ℹ️ MONGODB_URI not provided. Local JSON fallback active.');
    return false;
  }

  try {
    if (isConnected) return true;
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // Migrate from data/db.json
    await migrateLocalDataToMongo();
    return true;
  } catch (err: any) {
    console.error('❌ MongoDB Atlas connection error:', err?.message || err);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

async function migrateLocalDataToMongo() {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const localDB = JSON.parse(raw);

    // 1. Users (Guarantee Admin Account)
    const adminHash = bcrypt.hashSync('Admin@2026!', 10);
    const adminEmail = 'dedlek456@gmail.com';
    const adminExistsInMongo = await UserModel.findOne({ email: adminEmail }).exec();
    if (!adminExistsInMongo) {
      await UserModel.create({
        id: 'admin-dedlek456',
        name: 'الأدمن الرئيسي',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log(`[Migration] Seeded admin user into MongoDB: ${adminEmail} (admin)`);
    } else if (adminExistsInMongo.role !== 'admin') {
      adminExistsInMongo.role = 'admin';
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
            createdAt: u.createdAt || new Date().toISOString()
          });
          console.log(`[Migration] Seeded user into MongoDB: ${u.email} (${u.role})`);
        }
      }
    }

    // 2. Categories
    if (localDB.categories && Array.isArray(localDB.categories)) {
      for (const c of localDB.categories) {
        const exists = await CategoryModel.findOne({ id: c.id }).exec();
        if (!exists) {
          await CategoryModel.create(c);
          console.log(`[Migration] Seeded category into MongoDB: ${c.title}`);
        }
      }
    }

    // 3. Videos: Strictly 100% manual (Admin-only). NEVER seed, migrate, or auto-create any videos.
    // MongoDB is the permanent single source of truth.

    // 4. Products
    if (localDB.products && Array.isArray(localDB.products)) {
      for (const p of localDB.products) {
        const exists = await ProductModel.findOne({ id: p.id }).exec();
        if (!exists) {
          await ProductModel.create(p);
        }
      }
    }

    // 5. Orders: Permanently preserved in MongoDB. Do not clear or reset.
    // MongoDB Atlas is the single source of truth for orders.

    // 6. Settings
    if (localDB.settings) {
      const exists = await SettingsModel.findOne({ key: 'main' }).exec();
      if (!exists) {
        await SettingsModel.create({
          key: 'main',
          appName: localDB.settings.appName || 'خليكي جميلة',
          adminPin: localDB.settings.adminPin || '1234',
          lastUpdated: localDB.settings.lastUpdated || new Date().toISOString()
        });
      }
    }

    // 7. Notifications
    if (localDB.notifications && Array.isArray(localDB.notifications)) {
      for (const n of localDB.notifications) {
        const exists = await NotificationModel.findOne({ id: n.id }).exec();
        if (!exists) {
          await NotificationModel.create(n);
        }
      }
    }

    // 8. Favorites: Persist in MongoDB
    if (localDB.favorites && Array.isArray(localDB.favorites)) {
      for (const f of localDB.favorites) {
        const exists = await FavoriteModel.findOne({ id: f.id }).exec();
        if (!exists) {
          await FavoriteModel.create(f);
        }
      }
    }

    console.log('✅ Local data migration/seed to MongoDB completed.');
  } catch (err) {
    console.error('⚠️ Error during local to MongoDB migration:', err);
  }
}
