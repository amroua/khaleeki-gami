import { IndustryCategory, FormulationItem, UserOrder, SavedProject } from '../types';

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: 'detergents',
    title: 'مستحضرات التجميل والعناية',
    subtitle: 'سيروم، كريمات، غسول، خلطات تجميلية طبيعية',
    iconName: 'Sparkles',
    iconEmoji: '✨',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-pink-200',
    isAvailable: true,
    badgeText: 'متاح الآن',
    description: 'دليل شامل لمنتجات وتركيبات العناية بالبشرة والشعر ومستحضرات التجميل.',
    order: 1
  }
];

export const DETERGENT_FORMULATIONS: FormulationItem[] = [];

export const INITIAL_SAVED_PROJECTS: SavedProject[] = [];

export const INITIAL_USER_ORDERS: UserOrder[] = [];

