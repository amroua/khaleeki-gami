export type TabType = 'home' | 'favorites' | 'projects' | 'orders' | 'profile';

export interface IngredientItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  price?: string;
  percentage?: string;
  role?: string;
  notes?: string;
}

export interface ProductFormulation {
  id: string;
  categoryId: string; // e.g. 'detergents', 'cosmetics', 'food'
  name: string;
  description: string;
  difficulty: 'سهل' | 'متوسط' | 'متقدم';
  productionCost: number; // e.g. 15
  sellingPrice: number;   // e.g. 35
  profitMargin?: string;  // calculated or custom
  currency: string;       // e.g. 'ج.م' or 'ر.س'
  isSpecialOffer?: boolean; // عرض خاص
  specialOfferText?: string; // نص العرض الخاص (افتراضي: '✕ عرض خاص')
  batchSize?: string;     // e.g. '100 لتر' or '20 كجم'
  targetPh?: string;      // e.g. '7.0 - 7.5'
  mixingTime?: string;    // e.g. '30 دقيقة'
  ingredients: IngredientItem[];
  steps: string[];
  notesAndWarnings: string[];
  imageUrl?: string;
  isVisible: boolean;
  order: number;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  categoryId: string; // e.g. 'detergents', 'cosmetics'
  title: string;
  description: string;
  usageInstructions?: string; // طريقة الاستخدام الخاصة بكل فيديو
  productImages?: string[];   // صور المنتج المرفوعة من قبل الأدمن
  videoUrl: string;   // YouTube, Vimeo, direct MP4, or embed
  thumbnailUrl?: string;
  duration?: string;
  price?: number;
  currency?: string;
  isSpecialOffer?: boolean; // عرض خاص
  specialOfferText?: string; // نص العرض الخاص (افتراضي: '✕ عرض خاص')
  order: number;
  isVisible: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconEmoji: string;
  imageUrl?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isAvailable: boolean;
  badgeText: string;
  description: string;
  order: number;
}

// Backward compatibility with previous IndustryCategory
export type IndustryCategory = CategoryItem;

export interface RawMaterial {
  name: string;
  chemicalName?: string;
  percentage: string;
  role: string;
  note?: string;
}

export interface FormulationItem {
  id: string;
  name: string;
  englishName?: string;
  category?: string;
  description?: string;
  icon?: string;
  difficulty?: 'مبتدئ' | 'متوسط' | 'متقدم' | 'سهل';
  estimatedCostPerLiter?: string;
  suggestedSellPrice?: string;
  profitMargin?: string;
  targetPh?: string;
  mixingTime?: string;
  materials?: RawMaterial[];
  steps?: string[];
  safetyGuidelines?: string[];
  equipmentNeeded?: string[];
  commercialTip?: string;
}

export interface SavedProject {
  id: string;
  formulationId: string;
  title: string;
  category: string;
  progressPercentage: number;
  lastUpdated: string;
  notes: string;
  completedSteps: number[];
}

export interface SavedVideoItem {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  categoryTitle?: string;
  savedAt: string;
}

export type OrderStatus =
  | 'قيد المراجعة'
  | 'تم تأكيد الطلب'
  | 'تم التأكيد'
  | 'جاري التجهيز'
  | 'تم التسليم'
  | 'مرفوض'
  | 'مكتمل'
  | 'قيد التجهيز'
  | 'ملغي'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface UserOrder {
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
  status: OrderStatus | string;
  description?: string;
  cancelledBy?: 'user' | 'admin' | string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt?: string;
}

export interface CMSData {
  version: number;
  categories: CategoryItem[];
  videos: VideoItem[];
  products: ProductFormulation[];
  adminPin?: string;
  lastUpdated: string;
}

export type NotificationType = 'order_status' | 'new_video' | 'new_category' | 'offer' | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  targetUserEmail?: string;
  type: NotificationType;
  title: string;
  message: string;
  statusKey?: string;
  relatedId?: string;
  readBy?: string[];
  isRead?: boolean;
  createdAt: string;
}

