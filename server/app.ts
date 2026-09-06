import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  connectMongoDB,
  isMongoConnected,
  UserModel,
  CategoryModel,
  VideoModel,
  ProductModel,
  OrderModel,
  SettingsModel,
  NotificationModel,
  NotificationRecord,
  FavoriteModel,
  FavoriteRecord,
  UserRecord
} from './db';
import {
  initPushService,
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  updatePushPreferences,
  sendPushToUser,
  broadcastPushNotification
} from './pushService';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'open-your-project-secure-jwt-key-2026-xyz';

// Path for local fallback storage (safely handles Vercel read-only filesystem)
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Safe in read-only environment
}

interface ServerDB {
  users: UserRecord[];
  categories: any[];
  videos: any[];
  products: any[];
  orders: any[];
  notifications: NotificationRecord[];
  favorites?: FavoriteRecord[];
  settings: {
    appName: string;
    adminPin: string;
    lastUpdated: string;
  };
}

const INITIAL_DB: ServerDB = {
  users: [
    {
      id: 'admin-dedlek456',
      name: 'الأدمن الرئيسي',
      email: 'dedlek456@gmail.com',
      passwordHash: bcrypt.hashSync('Admin@2026!', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  categories: [
    {
      id: 'detergents',
      title: 'صناعة المنظفات والمطهرات',
      subtitle: 'الكلور، الصابون السائل، معطر الأرضيات، الجل',
      iconName: 'Sparkles',
      iconEmoji: '🧴',
      color: 'from-blue-600 to-indigo-700',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/40',
      isAvailable: true,
      badgeText: 'متاح للبدء فوراً',
      description: 'مشاريع خفيفة ومتوسطة لإنتاج وتعبئة المنظفات المنزلية والصناعية.',
      order: 1
    }
  ],
  videos: [],
  products: [],
  orders: [],
  notifications: [],
  favorites: [],
  settings: {
    appName: 'خليكي جميلة',
    adminPin: '1234',
    lastUpdated: new Date().toISOString()
  }
};

function readDB(): ServerDB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const seedPath = path.join(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(seedPath)) {
        try {
          if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
          }
          const seedContent = fs.readFileSync(seedPath, 'utf-8');
          fs.writeFileSync(DB_FILE, seedContent, 'utf-8');
          return JSON.parse(seedContent);
        } catch (e) {
          // fallback to seedContent or INITIAL_DB
        }
      }
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      } catch (e) {
        // Safe in read-only environment
      }
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Ensure admin account exists
    const hasAdmin = parsed.users && parsed.users.some((u: UserRecord) => u.email === 'dedlek456@gmail.com' && u.role === 'admin');
    if (!hasAdmin) {
      parsed.users = parsed.users || [];
      parsed.users.unshift(INITIAL_DB.users[0]);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (e) {}
    }
    parsed.notifications = parsed.notifications || [];
    parsed.favorites = parsed.favorites || [];
    return parsed;
  } catch (err) {
    console.error('Error reading DB:', err);
    return INITIAL_DB;
  }
}

function writeDB(data: ServerDB): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.settings.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Helper to create and persist non-intrusive notifications with deduplication
async function createNotification(params: {
  userId: string;
  targetUserEmail?: string;
  type: 'order_status' | 'new_video' | 'new_category' | 'offer' | 'general';
  title: string;
  message: string;
  statusKey?: string;
  relatedId?: string;
}): Promise<NotificationRecord | null> {
  try {
    const { userId, targetUserEmail, type, title, message, statusKey, relatedId } = params;

    // Deduplication check for order status updates
    if (type === 'order_status' && relatedId && statusKey) {
      if (isMongoConnected()) {
        const existing = await NotificationModel.findOne({
          relatedId,
          statusKey
        }).lean().exec();
        if (existing) return existing as NotificationRecord;
      } else {
        const db = readDB();
        const existing = (db.notifications || []).find(
          (n) => n.relatedId === relatedId && n.statusKey === statusKey
        );
        if (existing) return existing;
      }
    }

    // Deduplication check for new video / new category broadcasts
    if ((type === 'new_video' || type === 'new_category') && relatedId) {
      if (isMongoConnected()) {
        const existing = await NotificationModel.findOne({
          type,
          relatedId
        }).lean().exec();
        if (existing) return existing as NotificationRecord;
      } else {
        const db = readDB();
        const existing = (db.notifications || []).find(
          (n) => n.type === type && n.relatedId === relatedId
        );
        if (existing) return existing;
      }
    }

    const newNotif: NotificationRecord = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId,
      targetUserEmail: targetUserEmail ? targetUserEmail.toLowerCase() : '',
      type,
      title: title.trim(),
      message: message.trim(),
      statusKey: statusKey || '',
      relatedId: relatedId || '',
      readBy: [],
      createdAt: new Date().toISOString()
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
    console.error('Error creating notification:', err);
    return null;
  }
}

// Authenticated Request interface
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    name: string;
  };
}

// Admin-Only Middleware: Strictly verify role === 'admin'
async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'مطلوب رمز المصادقة (Token) لتنفيذ هذا الإجراء' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err || !decoded) {
      return res.status(403).json({ error: 'رمز المصادقة غير صالح أو منتهي الصلاحية' });
    }

    let userRole = decoded.role;
    let userId = decoded.id;
    let userEmail = decoded.email;
    let userName = decoded.name;

    if (isMongoConnected()) {
      try {
        const dbUser = await UserModel.findOne({ id: decoded.id } as any).exec();
        if (dbUser) {
          userRole = dbUser.role;
          userId = dbUser.id;
          userEmail = dbUser.email;
          userName = dbUser.name;
        }
      } catch (e) {
        console.warn('Error checking user in Mongo:', e);
      }
    } else {
      const db = readDB();
      const dbUser = db.users.find((u) => u.id === decoded.id && u.email === decoded.email);
      if (dbUser) {
        userRole = dbUser.role;
      }
    }

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'تم رفض الوصول: هذا الإجراء مخصص للمشرف (Admin) فقط ولا يمكن للمستخدم العادي تنفيذه.'
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

// User Authenticate Middleware: Verifies JWT for any authenticated user
async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'مطلوب تسجيل الدخول لتنفيذ هذا الإجراء' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err || !decoded) {
      return res.status(401).json({ error: 'جلسة الدخول منتهية أو غير صالحة' });
    }

    let userRole = decoded.role || 'user';
    let userId = decoded.id;
    let userEmail = decoded.email;
    let userName = decoded.name;

    if (isMongoConnected()) {
      try {
        const dbUser = await UserModel.findOne({ id: decoded.id } as any).exec();
        if (dbUser) {
          userRole = dbUser.role;
          userId = dbUser.id;
          userEmail = dbUser.email;
          userName = dbUser.name;
        }
      } catch (e) {
        console.warn('Error checking user in Mongo:', e);
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

// Optional Auth: extracts user from token if present, doesn't block if absent
async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (!err && decoded) {
      let userRole = decoded.role || 'user';
      let userId = decoded.id;
      let userEmail = decoded.email;
      let userName = decoded.name;

      if (isMongoConnected()) {
        try {
          const dbUser = await UserModel.findOne({ id: decoded.id } as any).exec();
          if (dbUser) {
            userRole = dbUser.role;
            userId = dbUser.id;
            userEmail = dbUser.email;
            userName = dbUser.name;
          }
        } catch (e) {
          // ignore
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

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration: Allow Render hosting, custom domains, and mobile clients
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Auto-connect MongoDB on demand (essential for Vercel Serverless cold starts)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.MONGODB_URI && !isMongoConnected()) {
    try {
      await connectMongoDB();
    } catch (e) {
      console.warn('Auto-connect MongoDB warning:', e);
    }
  }
  next();
});

let servicesInitialized = false;
export async function initServices() {
  if (servicesInitialized) return;
  await connectMongoDB();
  await initPushService();
  servicesInitialized = true;
}

  // ----------------------------------------------------
  // Authentication Routes
  // ----------------------------------------------------

  // 1. Admin / User Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const identifier = (req.body.identifier || req.body.email || req.body.phone || '').toString().trim();
      const password = req.body.password;

      if (!identifier || !password) {
        return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور' });
      }

      const normalizedInput = identifier.toLowerCase();
      const cleanPhone = identifier.replace(/[\s\-\(\)\+]/g, '');
      const isAdminAttempt = normalizedInput === 'admin' || normalizedInput === 'dedlek456@gmail.com';
      let user: any = null;

      if (isMongoConnected()) {
        const orConditions: any[] = [
          { email: normalizedInput },
          { phone: identifier },
          { id: normalizedInput }
        ];
        if (cleanPhone && cleanPhone !== normalizedInput) {
          orConditions.push({ phone: cleanPhone });
          orConditions.push({ email: cleanPhone });
        }
        if (isAdminAttempt) {
          orConditions.push({ role: 'admin' });
        }
        user = await UserModel.findOne({ $or: orConditions } as any).exec();
      }

      // Fallback if not found in Mongo or Mongo not connected
      if (!user) {
        const db = readDB();
        user = db.users.find(
          (u) =>
            u.email.toLowerCase() === normalizedInput ||
            (cleanPhone && u.email.toLowerCase() === cleanPhone) ||
            (u.phone && (u.phone === identifier || (cleanPhone && u.phone === cleanPhone))) ||
            (isAdminAttempt && (u.role === 'admin' || u.email === 'dedlek456@gmail.com'))
        );
      }

      // Auto-create Admin in DB if somehow missing
      if (!user && isAdminAttempt) {
        const newAdminHash = bcrypt.hashSync('Admin@2026!', 10);
        user = {
          id: 'admin-dedlek456',
          name: 'الأدمن الرئيسي',
          email: 'dedlek456@gmail.com',
          phone: '',
          passwordHash: newAdminHash,
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        if (isMongoConnected()) {
          try {
            await UserModel.create(user);
          } catch (e) {
            console.warn('Could not auto-create admin in Mongo:', e);
          }
        }

        const db = readDB();
        db.users.unshift(user);
        writeDB(db);
      }

      if (!user) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      let isMatch = false;
      if (user.passwordHash) {
        try {
          isMatch = bcrypt.compareSync(password, user.passwordHash);
        } catch (e) {
          isMatch = false;
        }
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        message: 'تم تسجيل الدخول بنجاح',
        token,
        database: isMongoConnected() ? 'MongoDB Atlas (Cloud)' : 'Local JSON',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
  });

  // 1.5 Admin Password Direct Reset (Secure Endpoint specifically for dedlek456@gmail.com)
  app.post('/api/auth/admin-reset-password', async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام' });
      }

      const adminEmail = (email || 'dedlek456@gmail.com').trim().toLowerCase();
      if (adminEmail !== 'dedlek456@gmail.com') {
        return res.status(403).json({ error: 'هذا المسار مخصص لحساب المشرف الرئيسي فقط' });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);

      let adminUser: UserRecord | null = null;

      if (isMongoConnected()) {
        const updated = await (UserModel as any).findOneAndUpdate(
          { email: adminEmail, role: 'admin' },
          { passwordHash: newHash },
          { new: true }
        ).lean().exec();
        if (updated) {
          adminUser = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            passwordHash: updated.passwordHash,
            role: 'admin',
            createdAt: updated.createdAt
          };
        }
      }

      const db = readDB();
      const localAdmin = db.users.find((u) => u.email.toLowerCase() === adminEmail && u.role === 'admin');
      if (localAdmin) {
        localAdmin.passwordHash = newHash;
        writeDB(db);
        if (!adminUser) {
          adminUser = localAdmin;
        }
      }

      if (!adminUser) {
        return res.status(404).json({ error: 'حساب المشرف غير موجود' });
      }

      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: 'admin', name: adminUser.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        message: 'تم تعيين كلمة المرور الجديدة للأدمن بنجاح وتحديث MongoDB',
        token,
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin'
        }
      });
    } catch (err) {
      console.error('Admin reset password error:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء تعيين كلمة المرور' });
    }
  });

  // 2. User Registration (STRICTLY role = 'user')
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, password } = req.body;
      const identifier = (req.body.identifier || req.body.email || req.body.phone || '').toString().trim();

      if (!name || !identifier || !password) {
        return res.status(400).json({ error: 'يرجى إدخال الاسم، والبريد الإلكتروني أو رقم الهاتف، وكلمة المرور' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل' });
      }

      const normalizedIdentifier = identifier.toLowerCase();
      const cleanPhone = identifier.replace(/[\s\-\(\)\+]/g, '');
      const isEmail = identifier.includes('@');

      if (isMongoConnected()) {
        const orConditions: any[] = [
          { email: normalizedIdentifier },
          { phone: identifier }
        ];
        if (cleanPhone && cleanPhone !== normalizedIdentifier) {
          orConditions.push({ phone: cleanPhone });
          orConditions.push({ email: cleanPhone });
        }
        const existing = await UserModel.findOne({ $or: orConditions } as any).exec();
        if (existing) {
          return res.status(400).json({ error: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل' });
        }
      }

      const db = readDB();
      const existingLocal = db.users.find(
        (u) =>
          u.email.toLowerCase() === normalizedIdentifier ||
          (cleanPhone && u.email.toLowerCase() === cleanPhone) ||
          (u.phone && (u.phone === identifier || (cleanPhone && u.phone === cleanPhone)))
      );
      if (existingLocal && !isMongoConnected()) {
        return res.status(400).json({ error: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل' });
      }

      const newUser: UserRecord = {
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        name: name.trim(),
        email: normalizedIdentifier,
        phone: isEmail ? '' : identifier,
        passwordHash: bcrypt.hashSync(password, 10),
        role: 'user', // NEVER allow 'admin' from registration
        createdAt: new Date().toISOString()
      };

      if (isMongoConnected()) {
        await UserModel.create(newUser);
      }

      // Keep backup in local JSON
      db.users.push(newUser);
      writeDB(db);

      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          phone: newUser.phone || '',
          role: newUser.role,
          name: newUser.name
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        message: 'تم إنشاء حساب المستخدم بنجاح',
        token,
        database: isMongoConnected() ? 'MongoDB Atlas (Cloud)' : 'Local JSON',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || '',
          role: newUser.role
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
  });

  // 3. Current User verification
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({ user: null, role: 'guest' });
    }

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err || !decoded) {
        return res.json({ user: null, role: 'guest' });
      }

      if (isMongoConnected()) {
        try {
          const user = await UserModel.findOne({ id: decoded.id } as any).exec();
          if (user) {
            return res.json({
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role
              }
            });
          }
        } catch (e) {
          console.warn('Mongo user lookup error:', e);
        }
      }

      const db = readDB();
      const user = db.users.find((u) => u.id === decoded.id);
      if (!user) {
        return res.json({ user: null, role: 'guest' });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role
        }
      });
    });
  });

  // ----------------------------------------------------
  // Push Notification Routes (Android & Web Push)
  // ----------------------------------------------------

  // 1. Get VAPID public key for browser push subscription
  app.get('/api/push/vapid-public-key', (req: Request, res: Response) => {
    try {
      const key = getVapidPublicKey();
      res.json({ publicKey: key });
    } catch (err) {
      console.error('Error fetching VAPID public key:', err);
      res.status(500).json({ error: 'تعذر جلب مفتاح الإشعارات العام' });
    }
  });

  // 2. Register/update client push subscription
  app.post('/api/push/subscribe', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { endpoint, keys, notificationsEnabled, userAgent, fcmToken, platform } = req.body;
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: 'بيانات الاشتراك في الإشعارات غير مكتملة' });
      }

      // Security: Extract user identity strictly from verified JWT
      const userId = req.user ? req.user.id : '';
      const userEmail = req.user ? (req.user.email || '').toLowerCase().trim() : '';
      const userRole = req.user ? req.user.role : 'guest';

      const record = await savePushSubscription({
        endpoint,
        keys,
        userId,
        userEmail,
        userRole: userRole as any,
        platform: platform || 'android',
        fcmToken,
        notificationsEnabled: userRole === 'admin' ? false : (notificationsEnabled !== false),
        userAgent: userAgent || (req.headers['user-agent'] as string) || ''
      });

      res.status(201).json({
        success: true,
        message: 'تم تفعيل إشعارات Push بنجاح',
        subscriptionId: record.id
      });
    } catch (err) {
      console.error('Error saving push subscription:', err);
      res.status(500).json({ error: 'فشل في حفظ اشتراك الإشعارات' });
    }
  });

  // 3. Disassociate push device on logout (strictly removes only this specific device/endpoint)
  app.post('/api/push/logout', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await removePushSubscription(endpoint);
        console.log(`🔒 Disassociated push endpoint on user logout: ${endpoint.slice(0, 35)}...`);
      }
      res.json({ success: true, message: 'تم فصل الجهاز بنجاح' });
    } catch (err) {
      console.error('Error in push logout endpoint:', err);
      res.status(500).json({ error: 'فشل في فصل الجهاز' });
    }
  });

  // 4. Unsubscribe push endpoint
  app.post('/api/push/unsubscribe', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await removePushSubscription(endpoint);
      }
      res.json({ success: true, message: 'تم إلغاء الاشتراك في الإشعارات' });
    } catch (err) {
      console.error('Error unsubscribing push:', err);
      res.status(500).json({ error: 'فشل إلغاء الاشتراك' });
    }
  });

  // 5. Update notification preferences (General alerts on/off)
  app.post('/api/push/preferences', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { notificationsEnabled, endpoint } = req.body;
      const userIdentifier = req.user?.id || req.user?.email || endpoint || '';
      if (userIdentifier) {
        await updatePushPreferences(userIdentifier, notificationsEnabled !== false);
      }
      res.json({ success: true, message: 'تم تحديث تفضيلات الإشعارات' });
    } catch (err) {
      console.error('Error updating push preferences:', err);
      res.status(500).json({ error: 'فشل تحديث الإعدادات' });
    }
  });

  // ----------------------------------------------------
  // Favorites Routes (Personalized, saved in MongoDB)
  // ----------------------------------------------------

  // 1. Get current user's favorites
  app.get('/api/favorites', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const userEmail = req.user!.email ? req.user!.email.toLowerCase() : '';

      let favoriteRecords: FavoriteRecord[] = [];

      if (isMongoConnected()) {
        const orConditions: any[] = [{ userId }];
        if (userEmail) orConditions.push({ userEmail });
        favoriteRecords = await FavoriteModel.find({ $or: orConditions }).lean().exec() as any;
      } else {
        const db = readDB();
        favoriteRecords = (db.favorites || []).filter(
          (f) => f.userId === userId || (userEmail && f.userEmail?.toLowerCase() === userEmail)
        );
      }

      const favoriteVideoIds = favoriteRecords.map((f) => f.videoId);

      // Fetch full video objects for rich display
      let fullVideos: any[] = [];
      if (favoriteVideoIds.length > 0) {
        if (isMongoConnected()) {
          fullVideos = await VideoModel.find({ id: { $in: favoriteVideoIds } }).lean().exec() as any;
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
      console.error('Error fetching favorites:', err);
      res.status(500).json({ error: 'فشل في جلب المفضلة' });
    }
  });

  // 2. Add video to favorites
  app.post('/api/favorites', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const { videoId } = req.body;
      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'معرف الفيديو مطلوب' });
      }

      const userId = req.user!.id;
      const userEmail = req.user!.email ? req.user!.email.toLowerCase() : '';
      const favId = `${userId}_${videoId}`;
      const now = new Date().toISOString();

      if (isMongoConnected()) {
        await (FavoriteModel as any).findOneAndUpdate(
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
        message: 'تمت الإضافة إلى المفضلة ❤️',
        isFavorite: true,
        videoId
      });
    } catch (err) {
      console.error('Error adding favorite:', err);
      res.status(500).json({ error: 'فشل في الإضافة إلى المفضلة' });
    }
  });

  // 3. Remove video from favorites
  app.delete('/api/favorites/:videoId', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const { videoId } = req.params;
      const userId = req.user!.id;
      const userEmail = req.user!.email ? req.user!.email.toLowerCase() : '';

      if (isMongoConnected()) {
        const orConditions: any[] = [{ userId, videoId }];
        if (userEmail) orConditions.push({ userEmail, videoId });
        await FavoriteModel.deleteMany({ $or: orConditions }).exec();
      }

      const db = readDB();
      if (db.favorites) {
        db.favorites = db.favorites.filter(
          (f) => !(f.videoId === videoId && (f.userId === userId || (userEmail && f.userEmail?.toLowerCase() === userEmail)))
        );
        writeDB(db);
      }

      res.json({
        success: true,
        message: 'تمت الإزالة من المفضلة ♡',
        isFavorite: false,
        videoId
      });
    } catch (err) {
      console.error('Error removing favorite:', err);
      res.status(500).json({ error: 'فشل في حذف العنصر من المفضلة' });
    }
  });

  // 4. Toggle video favorite status
  app.post('/api/favorites/toggle', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const { videoId } = req.body;
      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'معرف الفيديو مطلوب' });
      }

      const userId = req.user!.id;
      const userEmail = req.user!.email ? req.user!.email.toLowerCase() : '';
      const favId = `${userId}_${videoId}`;
      const now = new Date().toISOString();

      let exists = false;
      if (isMongoConnected()) {
        const orConditions: any[] = [{ userId, videoId }];
        if (userEmail) orConditions.push({ userEmail, videoId });
        const existingRecord = await FavoriteModel.findOne({ $or: orConditions }).lean().exec();
        exists = !!existingRecord;
      } else {
        const db = readDB();
        exists = (db.favorites || []).some(
          (f) => f.videoId === videoId && (f.userId === userId || (userEmail && f.userEmail?.toLowerCase() === userEmail))
        );
      }

      if (exists) {
        // Remove
        if (isMongoConnected()) {
          const orConditions: any[] = [{ userId, videoId }];
          if (userEmail) orConditions.push({ userEmail, videoId });
          await FavoriteModel.deleteMany({ $or: orConditions }).exec();
        }
        const db = readDB();
        if (db.favorites) {
          db.favorites = db.favorites.filter(
            (f) => !(f.videoId === videoId && (f.userId === userId || (userEmail && f.userEmail?.toLowerCase() === userEmail)))
          );
          writeDB(db);
        }

        return res.json({
          success: true,
          message: 'تمت إزالة الفيديو من المفضلة ♡',
          isFavorite: false,
          videoId
        });
      } else {
        // Add
        if (isMongoConnected()) {
          await (FavoriteModel as any).findOneAndUpdate(
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
          message: 'تمت إضافة الفيديو إلى المفضلة ❤️',
          isFavorite: true,
          videoId
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      res.status(500).json({ error: 'فشل في تعديل المفضلة' });
    }
  });

  // ----------------------------------------------------
  // CMS & Video Routes
  // ----------------------------------------------------

  // Public: Get all CMS Data (Categories, Videos, Products)
  app.get('/api/cms/data', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected()) {
        const [categories, videos, products, settings] = await Promise.all([
          CategoryModel.find().sort({ order: 1 }).lean().exec(),
          VideoModel.find().sort({ order: 1 }).lean().exec(),
          ProductModel.find().sort({ order: 1 }).lean().exec(),
          SettingsModel.findOne({ key: 'main' } as any).lean().exec()
        ]);

        return res.json({
          database: 'MongoDB Atlas (Cloud)',
          isPermanent: true,
          categories: categories && categories.length > 0 ? categories : INITIAL_DB.categories,
          videos: videos || [],
          products: products || [],
          settings: settings || INITIAL_DB.settings
        });
      }

      const db = readDB();
      res.json({
        database: 'Local Backup (data/db.json)',
        isPermanent: false,
        categories: db.categories,
        videos: db.videos,
        products: db.products,
        settings: db.settings
      });
    } catch (err) {
      console.error('Error fetching CMS data:', err);
      const db = readDB();
      res.json({
        categories: db.categories,
        videos: db.videos,
        products: db.products,
        settings: db.settings
      });
    }
  });

  // Admin-Only: Add new category
  app.post('/api/admin/categories', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, iconEmoji, imageUrl, isAvailable, badgeText, order } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'اسم القسم مطلوب' });
      }

      const newCategory = {
        id: req.body.id || 'cat-' + Date.now(),
        title: title.trim(),
        subtitle: req.body.subtitle || '',
        iconName: req.body.iconName || 'Sparkles',
        iconEmoji: iconEmoji ? iconEmoji.trim() : '🧴',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        color: req.body.color || 'from-purple-600 to-indigo-700',
        bgColor: req.body.bgColor || 'bg-purple-900/30',
        borderColor: req.body.borderColor || 'border-purple-500/40',
        isAvailable: isAvailable !== false,
        badgeText: badgeText ? badgeText.trim() : (isAvailable === false ? 'قريباً' : 'متاح للبدء'),
        description: description ? description.trim() : '',
        order: order !== undefined ? Number(order) : Date.now()
      };

      if (isMongoConnected()) {
        await CategoryModel.create(newCategory);
      }

      const db = readDB();
      db.categories.push(newCategory);
      writeDB(db);

      // Trigger broadcast notification for new category (only on creation, not edits)
      const catNotifTitle = '📂 قسم جديد';
      const catNotifMsg = 'تمت إضافة قسم جديد في خليكي جميلة ✨';

      createNotification({
        userId: 'all',
        type: 'new_category',
        title: catNotifTitle,
        message: catNotifMsg,
        relatedId: newCategory.id
      }).catch((err) => console.warn('Failed to dispatch category notification:', err));

      broadcastPushNotification({
        title: catNotifTitle,
        message: catNotifMsg,
        url: `/?category=${encodeURIComponent(newCategory.id)}`,
        type: 'new_category',
        relatedId: newCategory.id,
        tag: `new-category-${newCategory.id}`
      }).catch((e) => console.warn('Broadcast push error for new category:', e));

      res.status(201).json({
        message: 'تم إضافة القسم بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        category: newCategory
      });
    } catch (err) {
      console.error('Error adding category:', err);
      res.status(500).json({ error: 'فشل في حفظ القسم' });
    }
  });

  // Admin-Only: Update category
  app.put('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, iconEmoji, imageUrl, color, bgColor, borderColor, isAvailable, badgeText, order, subtitle } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (iconEmoji !== undefined) updateData.iconEmoji = iconEmoji.trim();
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
      if (color !== undefined) updateData.color = color;
      if (bgColor !== undefined) updateData.bgColor = bgColor;
      if (borderColor !== undefined) updateData.borderColor = borderColor;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
      if (badgeText !== undefined) updateData.badgeText = badgeText.trim();
      if (order !== undefined) updateData.order = Number(order);
      if (subtitle !== undefined) updateData.subtitle = subtitle.trim();

      let updatedCategory = null;

      if (isMongoConnected()) {
        updatedCategory = await (CategoryModel as any).findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean().exec();
      }

      const db = readDB();
      const index = db.categories.findIndex((c) => c.id === id);
      if (index >= 0) {
        db.categories[index] = { ...db.categories[index], ...updateData };
        writeDB(db);
        if (!updatedCategory) updatedCategory = db.categories[index];
      }

      if (!updatedCategory) {
        return res.status(404).json({ error: 'القسم غير موجود' });
      }

      res.json({
        message: 'تم تحديث القسم بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        category: updatedCategory
      });
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ error: 'فشل في تحديث القسم' });
    }
  });

  // Admin-Only: Delete category
  app.delete('/api/admin/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (isMongoConnected()) {
        await CategoryModel.deleteOne({ id } as any).exec();
        // Optional: delete associated videos or keep them
      }

      const db = readDB();
      db.categories = db.categories.filter((c) => c.id !== id);
      writeDB(db);

      res.json({
        message: 'تم حذف القسم بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON'
      });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'فشل في حذف القسم' });
    }
  });

  // Admin-Only: Add new video
  app.post('/api/admin/videos', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { categoryId, title, usageInstructions, productImages, videoUrl, price, currency, duration, isVisible, isSpecialOffer, specialOfferText } = req.body;

      if (!title || !videoUrl) {
        return res.status(400).json({ error: 'العنوان ورابط الفيديو مطلوبان' });
      }

      const newVideo = {
        id: 'vid-' + Date.now(),
        categoryId: categoryId || 'detergents',
        title: title.trim(),
        description: req.body.description || '',
        usageInstructions: usageInstructions || '',
        productImages: Array.isArray(productImages) ? productImages : [],
        videoUrl: videoUrl.trim(),
        thumbnailUrl: req.body.thumbnailUrl || '',
        duration: duration || '05:00',
        price: price !== undefined && price !== '' ? Number(price) : 0,
        currency: currency || 'جنيه',
        isSpecialOffer: isSpecialOffer === true || isSpecialOffer === 'true',
        specialOfferText: specialOfferText ? specialOfferText.trim() : '✕ عرض خاص',
        order: Date.now(),
        isVisible: isVisible !== false,
        createdAt: new Date().toISOString()
      };

      if (isMongoConnected()) {
        await VideoModel.create(newVideo);
      }

      // Local backup write
      const db = readDB();
      db.videos.push(newVideo);
      writeDB(db);

      // Trigger broadcast notification for new video (only on creation, not edits)
      let catName = 'الأقسام';
      const cat = db.categories.find((c: any) => c.id === newVideo.categoryId);
      if (cat && cat.title) {
        catName = cat.title;
      } else if (isMongoConnected()) {
        try {
          const catMongo = await CategoryModel.findOne({ id: newVideo.categoryId }).lean().exec();
          if (catMongo && catMongo.title) catName = catMongo.title;
        } catch (e) {
          // ignore
        }
      }

      const vidNotifTitle = '🎥 فيديو جديد';
      const vidNotifMsg = 'تمت إضافة فيديو جديد في خليكي جميلة ✨';

      createNotification({
        userId: 'all',
        type: 'new_video',
        title: vidNotifTitle,
        message: vidNotifMsg,
        relatedId: newVideo.id
      }).catch((err) => console.warn('Failed to dispatch video notification:', err));

      broadcastPushNotification({
        title: vidNotifTitle,
        message: vidNotifMsg,
        url: `/?video=${encodeURIComponent(newVideo.id)}`,
        type: 'new_video',
        relatedId: newVideo.id,
        tag: `new-video-${newVideo.id}`
      }).catch((e) => console.warn('Broadcast push error for new video:', e));

      res.status(201).json({
        message: 'تم حفظ الفيديو بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        video: newVideo
      });
    } catch (err) {
      console.error('Error adding video:', err);
      res.status(500).json({ error: 'فشل في حفظ الفيديو' });
    }
  });

  // Admin-Only: Update existing video
  app.put('/api/admin/videos/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, videoUrl, usageInstructions, productImages, price, currency, isVisible, categoryId, isSpecialOffer, specialOfferText } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl.trim();
      if (usageInstructions !== undefined) updateData.usageInstructions = usageInstructions;
      if (productImages !== undefined && Array.isArray(productImages)) updateData.productImages = productImages;
      if (price !== undefined && price !== '') updateData.price = Number(price);
      if (currency !== undefined) updateData.currency = currency;
      if (isVisible !== undefined) updateData.isVisible = isVisible;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (isSpecialOffer !== undefined) updateData.isSpecialOffer = isSpecialOffer === true || isSpecialOffer === 'true';
      if (specialOfferText !== undefined) updateData.specialOfferText = specialOfferText.trim();

      let updatedVideo = null;

      if (isMongoConnected()) {
        updatedVideo = await (VideoModel as any).findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean().exec();
      }

      const db = readDB();
      const index = db.videos.findIndex((v) => v.id === id);
      if (index >= 0) {
        db.videos[index] = { ...db.videos[index], ...updateData };
        writeDB(db);
        if (!updatedVideo) updatedVideo = db.videos[index];
      }

      if (!updatedVideo) {
        return res.status(404).json({ error: 'الفيديو غير موجود' });
      }

      res.json({
        message: 'تم تحديث الفيديو بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        video: updatedVideo
      });
    } catch (err) {
      console.error('Error updating video:', err);
      res.status(500).json({ error: 'فشل في تحديث الفيديو' });
    }
  });

  // Admin-Only: Add Image to Video
  app.post('/api/admin/videos/:id/images', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl || !imageUrl.trim()) {
        return res.status(400).json({ error: 'رابط أو بيانات الصورة مطلوبة' });
      }

      let updatedVideo = null;
      if (isMongoConnected()) {
        updatedVideo = await (VideoModel as any).findOneAndUpdate(
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
        return res.status(404).json({ error: 'الفيديو غير موجود' });
      }

      res.json({
        message: 'تمت إضافة صورة المنتج بنجاح',
        productImages: updatedVideo.productImages || []
      });
    } catch (err) {
      console.error('Error adding product image:', err);
      res.status(500).json({ error: 'فشل في إضافة الصورة' });
    }
  });

  // Admin-Only: Delete Image from Video
  app.delete('/api/admin/videos/:id/images', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { imageIndex, imageUrl } = req.body;

      let updatedVideo = null;
      const db = readDB();
      const vid = db.videos.find((v) => v.id === id);

      if (vid && Array.isArray(vid.productImages)) {
        if (imageIndex !== undefined && imageIndex >= 0 && imageIndex < vid.productImages.length) {
          vid.productImages.splice(imageIndex, 1);
        } else if (imageUrl) {
          vid.productImages = vid.productImages.filter((img) => img !== imageUrl);
        }
        writeDB(db);
        updatedVideo = vid;
      }

      if (isMongoConnected()) {
        if (vid?.productImages) {
          updatedVideo = await (VideoModel as any).findOneAndUpdate(
            { id },
            { $set: { productImages: vid.productImages } },
            { new: true }
          ).lean().exec();
        }
      }

      if (!updatedVideo) {
        return res.status(404).json({ error: 'الفيديو غير موجود' });
      }

      res.json({
        message: 'تم حذف صورة المنتج بنجاح',
        productImages: updatedVideo.productImages || []
      });
    } catch (err) {
      console.error('Error deleting product image:', err);
      res.status(500).json({ error: 'فشل في حذف الصورة' });
    }
  });

  // Admin-Only: Delete video
  app.delete('/api/admin/videos/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (isMongoConnected()) {
        await VideoModel.deleteOne({ id } as any).exec();
      }

      const db = readDB();
      db.videos = db.videos.filter((v) => v.id !== id);
      writeDB(db);

      res.json({
        message: 'تم حذف الفيديو بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON'
      });
    } catch (err) {
      console.error('Error deleting video:', err);
      res.status(500).json({ error: 'فشل في حذف الفيديو' });
    }
  });

  // Admin-Only: Change Admin Password
  app.post('/api/admin/change-password', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام' });
      }

      const adminEmail = req.user?.email || 'dedlek456@gmail.com';
      const newHash = bcrypt.hashSync(newPassword, 10);

      if (isMongoConnected()) {
        await (UserModel as any).findOneAndUpdate(
          { email: adminEmail, role: 'admin' },
          { passwordHash: newHash }
        ).exec();
      }

      const db = readDB();
      const adminUser = db.users.find((u) => u.email === adminEmail && u.role === 'admin');
      if (adminUser) {
        adminUser.passwordHash = newHash;
        writeDB(db);
      }

      return res.json({ message: 'تم تحديث كلمة مرور الأدمن بنجاح في قاعدة البيانات' });
    } catch (err) {
      console.error('Change admin password error:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء تحديث كلمة المرور' });
    }
  });

  // Admin-Only: Save all CMS settings
  app.put('/api/admin/cms', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { categories, videos, products, settings } = req.body;

      if (isMongoConnected()) {
        if (categories && Array.isArray(categories)) {
          for (const cat of categories) {
            await (CategoryModel as any).findOneAndUpdate({ id: cat.id }, cat, { upsert: true }).exec();
          }
        }
        if (videos && Array.isArray(videos)) {
          const videoIds = videos.map((v) => v.id).filter(Boolean);
          // Delete any video from MongoDB that was removed by the admin
          await VideoModel.deleteMany({ id: { $nin: videoIds } }).exec();
          for (const vid of videos) {
            await (VideoModel as any).findOneAndUpdate({ id: vid.id }, vid, { upsert: true }).exec();
          }
        }
        if (products && Array.isArray(products)) {
          for (const prod of products) {
            await (ProductModel as any).findOneAndUpdate({ id: prod.id }, prod, { upsert: true }).exec();
          }
        }
        if (settings) {
          await (SettingsModel as any).findOneAndUpdate(
            { key: 'main' },
            { ...settings, key: 'main', lastUpdated: new Date().toISOString() },
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
        message: 'تم تحديث المحتوى بالكامل بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON'
      });
    } catch (err) {
      console.error('Error updating CMS:', err);
      res.status(500).json({ error: 'فشل في حفظ التعديلات' });
    }
  });

function normalizeOrderStatus(status?: string): string {
  const s = (status || '').trim().toLowerCase();
  if (s === 'confirmed' || s === 'تم التأكيد' || s === 'تم تأكيد الطلب' || s === 'مؤكد') return 'confirmed';
  if (s === 'preparing' || s === 'تم التجهيز' || s === 'جاري التجهيز' || s === 'قيد التجهيز') return 'preparing';
  if (s === 'delivered' || s === 'تم التسليم' || s === 'مكتمل' || s === 'تم التوصيل') return 'delivered';
  if (s === 'cancelled' || s === 'canceled' || s === 'ملغي' || s === 'تم الإلغاء') return 'cancelled';
  if (s === 'rejected' || s === 'مرفوض') return 'rejected';
  return 'pending';
}

  // Orders: Place order (authenticated or guest with details)
  app.post('/api/orders', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const order = req.body;
      const userId = req.user?.id || order.userId || '';
      const userEmail = req.user?.email || order.userEmail || '';
      let userName = order.userName || req.user?.name || '';
      let userPhone = order.userPhone || (req.user as any)?.phone || '';
      let userAddress = order.userAddress || '';

      // Auto-extract customer details if encoded in description
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

      const quantity = order.quantity ? Number(order.quantity) : (order.itemsCount ? Number(order.itemsCount) : 1);
      const unitPrice = order.unitPrice !== undefined && order.unitPrice !== null ? order.unitPrice : (order.price ? String(order.price).replace(/جنيه/g, '').trim() : '0');
      const totalPrice = order.totalPrice !== undefined && order.totalPrice !== null ? order.totalPrice : (order.price ? String(order.price).replace(/جنيه/g, '').trim() : '0');

      const cleanPrice = String(totalPrice).replace(/جنيه/g, '').trim();
      const rawStatus = order.status || 'pending';
      const status = normalizeOrderStatus(rawStatus);

      const newOrder = {
        id: order.id || 'ord-' + Date.now(),
        orderNumber: order.orderNumber || '#' + Math.floor(100000 + Math.random() * 900000),
        userId,
        userEmail,
        userName,
        userPhone,
        userAddress,
        title: order.title || 'طلب منتج',
        type: order.type || 'مستحضرات تجميل',
        quantity,
        itemsCount: quantity,
        unitPrice,
        totalPrice,
        price: `${cleanPrice} جنيه`,
        description: order.description || '',
        date: order.date || new Date().toLocaleDateString('ar-EG'),
        status,
        cancelledBy: '',
        cancelledAt: '',
        cancelReason: '',
        createdAt: new Date().toISOString()
      };

      if (isMongoConnected()) {
        await OrderModel.create(newOrder);
      }

      const db = readDB();
      db.orders.unshift(newOrder);
      writeDB(db);

      // Notify the specific user about order placement
      if (newOrder.userId || newOrder.userEmail) {
        const orderNotifTitle = '📦 تم استلام طلبك';
        const orderNotifMsg = `تم استلام طلبك (${newOrder.title}) برقم ${newOrder.orderNumber} بنجاح. طلبك قيد المراجعة حالياً.`;

        createNotification({
          userId: newOrder.userId || 'guest',
          targetUserEmail: newOrder.userEmail,
          type: 'order_status',
          statusKey: 'pending',
          title: orderNotifTitle,
          message: orderNotifMsg,
          relatedId: newOrder.id
        }).catch((err) => console.warn('Failed to dispatch order notification:', err));

        // Push real notification to user's device
        sendPushToUser(
          newOrder.userId,
          newOrder.userEmail,
          {
            title: orderNotifTitle,
            message: orderNotifMsg,
            url: `/?tab=orders&orderId=${encodeURIComponent(newOrder.id)}`,
            orderId: newOrder.id,
            type: 'order_status',
            statusKey: 'pending',
            tag: `order-${newOrder.id}-pending`
          }
        ).catch((err) => console.warn('Failed to dispatch order push notification:', err));
      }

      res.status(201).json({
        message: 'تم إرسال الطلب بنجاح',
        database: isMongoConnected() ? 'MongoDB Atlas' : 'Local JSON',
        order: newOrder
      });
    } catch (err) {
      console.error('Error placing order:', err);
      res.status(500).json({ error: 'فشل في حفظ الطلب' });
    }
  });

  // Orders: Get orders for regular user (Strictly only their own orders)
  app.get('/api/orders', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user!;

      // If user is Admin, they can also see all orders here or via /api/admin/orders
      if (currentUser.role === 'admin') {
        if (isMongoConnected()) {
          const orders = await OrderModel.find().sort({ createdAt: -1 }).lean().exec();
          return res.json(orders);
        }
        const db = readDB();
        return res.json(db.orders || []);
      }

      // Regular User Role: Strictly filter by currentUser.id / email
      if (isMongoConnected()) {
        const orConditions: any[] = [];
        if (currentUser.id) orConditions.push({ userId: currentUser.id });
        if (currentUser.email) orConditions.push({ userEmail: currentUser.email });

        if (orConditions.length === 0) {
          return res.json([]);
        }

        const userOrders = await OrderModel.find({ $or: orConditions }).sort({ createdAt: -1 }).lean().exec();
        return res.json(userOrders);
      }

      const db = readDB();
      const userOrders = (db.orders || []).filter((o: any) =>
        (currentUser.id && o.userId === currentUser.id) ||
        (currentUser.email && o.userEmail === currentUser.email)
      );
      res.json(userOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'فشل في استرجاع الطلبات' });
    }
  });

  // Admin-Only: Get all orders across the entire application
  app.get('/api/admin/orders', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      let rawOrders: any[] = [];
      if (isMongoConnected()) {
        rawOrders = await OrderModel.find().sort({ createdAt: -1 }).lean().exec();
      } else {
        const db = readDB();
        rawOrders = db.orders || [];
      }

      const formattedOrders = rawOrders.map((order: any) => {
        let userName = order.userName || '';
        let userPhone = order.userPhone || '';
        let userAddress = order.userAddress || '';

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
        const unitPrice = order.unitPrice !== undefined && order.unitPrice !== null ? order.unitPrice : order.price;
        const totalPrice = order.totalPrice !== undefined && order.totalPrice !== null ? order.totalPrice : order.price;

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
      console.error('Error fetching admin orders:', err);
      res.status(500).json({ error: 'فشل في استرجاع طلبات المشرف' });
    }
  });

  // Orders: Get single order by ID with authorization check
  app.get('/api/orders/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user!;
      const orderId = req.params.id;

      let order: any = null;
      if (isMongoConnected()) {
        order = await OrderModel.findOne({ id: orderId } as any).lean().exec();
      } else {
        const db = readDB();
        order = db.orders.find((o) => o.id === orderId);
      }

      if (!order) {
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      // Security check: non-admins cannot access orders of other users
      if (currentUser.role !== 'admin' && order.userId !== currentUser.id && order.userEmail !== currentUser.email) {
        return res.status(403).json({ error: 'غير مصرح لك بالوصول لبيانات هذا الطلب' });
      }

      res.json(order);
    } catch (err) {
      console.error('Error fetching order by ID:', err);
      res.status(500).json({ error: 'فشل في استرجاع بيانات الطلب' });
    }
  });

  // Admin-Only: Handler for updating order status in MongoDB
  const handleAdminUpdateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, cancelledBy: reqCancelledBy, cancelReason } = req.body;
      const normalizedStatus = normalizeOrderStatus(status);

      // Check current status before updating to prevent duplicate notifications
      let previousStatus = '';
      const db = readDB();
      const existingLocal = db.orders.find((o) => o.id === id);
      if (existingLocal) previousStatus = existingLocal.status;

      if (isMongoConnected()) {
        const existingMongo = await OrderModel.findOne({ id } as any).lean().exec();
        if (existingMongo) previousStatus = existingMongo.status;
      }

      let cancelledBy = reqCancelledBy || '';
      let cancelledAt = '';
      if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        cancelledBy = cancelledBy || 'admin';
        cancelledAt = new Date().toISOString();
      }

      const updateFields: any = { status: normalizedStatus };
      if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        updateFields.cancelledBy = cancelledBy;
        updateFields.cancelledAt = cancelledAt;
        if (cancelReason) updateFields.cancelReason = cancelReason;
      } else {
        updateFields.cancelledBy = '';
        updateFields.cancelledAt = '';
      }

      let updatedOrder: any = null;
      if (isMongoConnected()) {
        updatedOrder = await (OrderModel as any).findOneAndUpdate(
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
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      // Notify ONLY the user who owns this order, only if the status actually changed
      if (previousStatus !== normalizedStatus && (updatedOrder.userId || updatedOrder.userEmail)) {
        const orderNum = (updatedOrder.orderNumber || updatedOrder.id || '').replace(/^#/, '');

        const statusNotifMap: Record<string, { title: string; message: string }> = {
          pending: {
            title: '🟡 قيد المراجعة',
            message: `طلبك رقم #${orderNum} قيد المراجعة الآن من الإدارة`
          },
          confirmed: {
            title: '🔵 تم التأكيد',
            message: `تم تأكيد طلبك رقم #${orderNum} ويمكننا البدء في تجهيزه`
          },
          preparing: {
            title: '🟠 قيد التجهيز',
            message: `بدأنا في تجهيز طلبك رقم #${orderNum} وسنوافيك بالجديد`
          },
          delivered: {
            title: '🟢 تم التسليم',
            message: `تم تسليم طلبك رقم #${orderNum} شكرًا لثقتك بنا!`
          },
          rejected: {
            title: '🔴 تم الرفض',
            message: `تم رفض الطلب رقم #${orderNum} تواصل معنا من تفاصيل الطلب`
          },
          cancelled: {
            title: '🔴 تم إلغاء الطلب',
            message: `تم إلغاء الطلب رقم #${orderNum} بواسطة ${cancelledBy === 'user' ? 'العميل' : 'الإدارة'}`
          }
        };

        const notifInfo = statusNotifMap[normalizedStatus] || {
          title: `تحديث حالة طلبك #${orderNum}`,
          message: `تم تغيير حالة طلبك إلى: ${normalizedStatus}`
        };

        // 1. Persistent in-app notification record
        createNotification({
          userId: updatedOrder.userId || 'guest',
          targetUserEmail: updatedOrder.userEmail,
          type: 'order_status',
          statusKey: normalizedStatus,
          title: notifInfo.title,
          message: notifInfo.message,
          relatedId: updatedOrder.id
        }).catch((err) => console.warn('Failed to send order status notification:', err));

        // 2. Real Push Notification directly to customer's Android device
        sendPushToUser(
          updatedOrder.userId,
          updatedOrder.userEmail,
          {
            title: notifInfo.title,
            message: notifInfo.message,
            url: `/?order=${encodeURIComponent(updatedOrder.id)}`,
            orderId: updatedOrder.id,
            type: 'order_status',
            statusKey: normalizedStatus,
            tag: `order-${updatedOrder.id}-${normalizedStatus}`
          }
        ).catch((err) => console.warn('Failed to dispatch Android push notification:', err));
      }

      res.json({ message: 'تم تحديث حالة الطلب بنجاح', order: updatedOrder });
    } catch (err) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: 'فشل في تحديث الطلب' });
    }
  };

  app.put('/api/admin/orders/:id/status', requireAdmin, handleAdminUpdateOrderStatus);
  app.patch('/api/admin/orders/:id/status', requireAdmin, handleAdminUpdateOrderStatus);
  app.put('/api/admin/orders/:id', requireAdmin, handleAdminUpdateOrderStatus);

  // Customer: Cancel an order securely
  app.post('/api/orders/:id/cancel', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user!;
      const orderId = req.params.id;

      let order: any = null;
      if (isMongoConnected()) {
        order = await OrderModel.findOne({ id: orderId } as any).lean().exec();
      } else {
        const db = readDB();
        order = db.orders.find((o) => o.id === orderId);
      }

      if (!order) {
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      // Security check: User must own the order or be an admin
      const isOwner =
        (currentUser.id && order.userId === currentUser.id) ||
        (currentUser.email && order.userEmail && currentUser.email.toLowerCase() === order.userEmail.toLowerCase());

      if (currentUser.role !== 'admin' && !isOwner) {
        return res.status(403).json({ error: 'غير مصرح لك بإلغاء هذا الطلب' });
      }

      // Business logic validations:
      const currentNorm = normalizeOrderStatus(order.status);
      if (currentNorm === 'cancelled' || currentNorm === 'rejected' || order.cancelledBy) {
        return res.status(400).json({ error: 'الطلب ملغي بالفعل ولا يمكن إلغاؤه مرة أخرى' });
      }

      // Customer can ONLY cancel when status is 'pending' (قيد المراجعة)
      // Once admin confirms the order, customer is strictly forbidden from cancelling
      if (currentUser.role !== 'admin') {
        if (currentNorm !== 'pending') {
          return res.status(400).json({
            error: 'عذراً، لا يمكن إلغاء الطلب إلا عندما تكون حالته "قيد المراجعة". تم تأكيد أو تجهيز الطلب بالفعل.'
          });
        }
      } else {
        if (currentNorm === 'delivered') {
          return res.status(400).json({ error: 'عذراً، الطلب تم تسليمه بالفعل ولا يمكن إلغاؤه' });
        }
      }

      const cancelledBy = currentUser.role === 'admin' ? 'admin' : 'user';
      const cancelledAt = new Date().toISOString();
      const newStatus = 'cancelled';

      const updateFields = {
        status: newStatus,
        cancelledBy,
        cancelledAt
      };

      let updatedOrder: any = null;
      if (isMongoConnected()) {
        updatedOrder = await (OrderModel as any).findOneAndUpdate(
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
        return res.status(500).json({ error: 'فشل في تحديث بيانات الطلب' });
      }

      // Dispatch cancellation notification
      if (updatedOrder.userId || updatedOrder.userEmail) {
        const orderNum = (updatedOrder.orderNumber || updatedOrder.id || '').replace(/^#/, '');
        createNotification({
          userId: updatedOrder.userId || 'guest',
          targetUserEmail: updatedOrder.userEmail,
          type: 'order_status',
          statusKey: 'cancelled',
          title: '❌ تم إلغاء الطلب',
          message: `تم إلغاء طلبك رقم #${orderNum} بنجاح.`,
          relatedId: updatedOrder.id
        }).catch((err) => console.warn('Failed to dispatch cancel notification:', err));
      }

      res.json({
        message: 'تم إلغاء الطلب بنجاح',
        order: updatedOrder
      });
    } catch (err) {
      console.error('Error cancelling order:', err);
      res.status(500).json({ error: 'فشل في تنفيذ إلغاء الطلب' });
    }
  });

  // Delete an order securely (Customer can delete their own order, Admin can delete any order)
  app.delete('/api/orders/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user!;
      const orderId = req.params.id;

      let order: any = null;
      if (isMongoConnected()) {
        order = await OrderModel.findOne({ id: orderId } as any).lean().exec();
      } else {
        const db = readDB();
        order = db.orders.find((o) => o.id === orderId);
      }

      if (!order) {
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      // Security check: User must own the order or be an admin
      const isOwner =
        (currentUser.id && order.userId === currentUser.id) ||
        (currentUser.email && order.userEmail && currentUser.email.toLowerCase() === order.userEmail.toLowerCase());

      if (currentUser.role !== 'admin' && !isOwner) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف هذا الطلب' });
      }

      if (isMongoConnected()) {
        await OrderModel.deleteOne({ id: orderId } as any).exec();
      }

      const db = readDB();
      db.orders = (db.orders || []).filter((o) => o.id !== orderId);
      writeDB(db);

      res.json({ success: true, message: 'تم حذف الطلب بنجاح', orderId });
    } catch (err) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'فشل في حذف الطلب' });
    }
  });

  // Admin alias for deleting order
  app.delete('/api/admin/orders/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      if (isMongoConnected()) {
        await OrderModel.deleteOne({ id: orderId } as any).exec();
      }
      const db = readDB();
      db.orders = (db.orders || []).filter((o) => o.id !== orderId);
      writeDB(db);
      res.json({ success: true, message: 'تم حذف الطلب بنجاح من لوحة الأدمن', orderId });
    } catch (err) {
      console.error('Error deleting admin order:', err);
      res.status(500).json({ error: 'فشل في حذف الطلب' });
    }
  });

  // ----------------------------------------------------
  // Notifications Routes
  // ----------------------------------------------------

  // Get notifications for current user (Orders + General content broadcasts)
  app.get('/api/notifications', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      const includeGeneral = req.query.includeGeneral !== 'false';

      let allNotifs: NotificationRecord[] = [];
      if (isMongoConnected()) {
        allNotifs = await NotificationModel.find().sort({ createdAt: -1 }).limit(100).lean().exec() as any;
      } else {
        const db = readDB();
        allNotifs = db.notifications || [];
      }

      const userIdentifier = currentUser?.id || '';
      const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : '';

      const filtered = allNotifs.filter((n: any) => {
        // Filter out if current user has cleared this notification
        const isCleared = Array.isArray(n.clearedBy) && (
          (userIdentifier && n.clearedBy.includes(userIdentifier)) ||
          (userEmail && n.clearedBy.includes(userEmail)) ||
          (!userIdentifier && n.clearedBy.includes('guest'))
        );
        if (isCleared) return false;

        // Broadcast notifications: shown if user has general notifications enabled
        if (n.userId === 'all') {
          return includeGeneral;
        }

        // Order status notifications: strictly for this specific customer
        if (userIdentifier && n.userId === userIdentifier) return true;
        if (userEmail && n.targetUserEmail && n.targetUserEmail.toLowerCase() === userEmail) return true;

        // Admin only receives order notifications if admin was the actual customer who created the order
        return false;
      });

      const result = filtered.map((n) => {
        const isRead = Array.isArray(n.readBy) && (
          (userIdentifier && n.readBy.includes(userIdentifier)) ||
          (userEmail && n.readBy.includes(userEmail)) ||
          (!userIdentifier && n.readBy.includes('guest'))
        );
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
      console.error('Error fetching notifications:', err);
      res.status(500).json({ error: 'فشل استرجاع الإشعارات' });
    }
  });

  // Mark single notification as read
  app.post('/api/notifications/:id/read', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      const readerId = currentUser?.id || currentUser?.email || 'guest';

      if (isMongoConnected()) {
        await (NotificationModel as any).findOneAndUpdate(
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

      res.json({ success: true, message: 'تم تحديث حالة القراءة' });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      res.status(500).json({ error: 'فشل تحديث الإشعار' });
    }
  });

  // Mark all notifications as read
  app.post('/api/notifications/read-all', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      const readerId = currentUser?.id || currentUser?.email || 'guest';
      const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : '';

      if (isMongoConnected()) {
        const conditions: any[] = [{ userId: 'all' }];
        if (currentUser?.id) conditions.push({ userId: currentUser.id });
        if (userEmail) conditions.push({ targetUserEmail: userEmail });

        await (NotificationModel as any).updateMany(
          { $or: conditions },
          { $addToSet: { readBy: readerId } }
        ).exec();
      }

      const db = readDB();
      db.notifications = db.notifications || [];
      for (const notif of db.notifications) {
        const isRelevant =
          notif.userId === 'all' ||
          (currentUser?.id && notif.userId === currentUser.id) ||
          (userEmail && notif.targetUserEmail?.toLowerCase() === userEmail);
        if (isRelevant) {
          notif.readBy = notif.readBy || [];
          if (!notif.readBy.includes(readerId)) {
            notif.readBy.push(readerId);
          }
        }
      }
      writeDB(db);

      res.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      res.status(500).json({ error: 'فشل تحديث الإشعارات' });
    }
  });

  // Clear/delete customer notifications for the current user
  app.post('/api/notifications/clear', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      const userIdentifier = currentUser?.id || currentUser?.email || 'guest';
      const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : '';

      if (isMongoConnected()) {
        await (NotificationModel as any).updateMany(
          {},
          { $addToSet: { clearedBy: userIdentifier } }
        ).exec();
        if (userEmail && userEmail !== userIdentifier) {
          await (NotificationModel as any).updateMany(
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

      res.json({ success: true, message: 'تم مسح إشعاراتك بنجاح' });
    } catch (err) {
      console.error('Error clearing notifications:', err);
      res.status(500).json({ error: 'فشل في مسح الإشعارات' });
    }
  });

  app.delete('/api/notifications', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const currentUser = req.user;
      const userIdentifier = currentUser?.id || currentUser?.email || 'guest';
      const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : '';

      if (isMongoConnected()) {
        await (NotificationModel as any).updateMany(
          {},
          { $addToSet: { clearedBy: userIdentifier } }
        ).exec();
        if (userEmail && userEmail !== userIdentifier) {
          await (NotificationModel as any).updateMany(
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

      res.json({ success: true, message: 'تم مسح إشعاراتك بنجاح' });
    } catch (err) {
      console.error('Error clearing notifications via DELETE:', err);
      res.status(500).json({ error: 'فشل في مسح الإشعارات' });
    }
  });

  // Delete a notification
  app.delete('/api/notifications/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (isMongoConnected()) {
        await NotificationModel.deleteOne({ id } as any).exec();
      }
      const db = readDB();
      if (db.notifications) {
        db.notifications = db.notifications.filter((n) => n.id !== id);
        writeDB(db);
      }
      res.json({ success: true, message: 'تم حذف الإشعار' });
    } catch (err) {
      console.error('Error deleting notification:', err);
      res.status(500).json({ error: 'فشل حذف الإشعار' });
    }
  });

  // Health check & DB status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: isMongoConnected() ? 'MongoDB Atlas (Connected & Permanent)' : 'Local JSON Fallback',
      isMongoConnected: isMongoConnected(),
      time: new Date().toISOString()
    });
  });

export { app };
export default app;
