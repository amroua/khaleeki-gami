export interface CategoryTheme {
  id: string;
  name: string;
  previewColor: string; // For the color picker button
  gradient: string;
  cardBg: string;
  border: string;
  badge: string;
  iconBg: string;
  textColor: string;
}

export const CATEGORY_THEMES: CategoryTheme[] = [
  {
    id: 'rose-gold',
    name: 'وردي روز جولد',
    previewColor: '#f43f5e',
    gradient: 'from-rose-500 to-pink-600',
    cardBg: 'bg-gradient-to-br from-[#3b1227] via-[#2d0f20] to-[#1c0814]',
    border: 'border-rose-500/50 hover:border-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    iconBg: 'bg-rose-600/30 text-rose-200 border-rose-400/40',
    textColor: 'text-rose-100'
  },
  {
    id: 'lavender-mauve',
    name: 'لافندر موف',
    previewColor: '#a855f7',
    gradient: 'from-purple-500 to-indigo-600',
    cardBg: 'bg-gradient-to-br from-[#2b104a] via-[#200c38] to-[#140624]',
    border: 'border-purple-500/50 hover:border-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconBg: 'bg-purple-600/30 text-purple-200 border-purple-400/40',
    textColor: 'text-purple-100'
  },
  {
    id: 'peach-coral',
    name: 'خوخي كورال',
    previewColor: '#f97316',
    gradient: 'from-amber-500 to-rose-500',
    cardBg: 'bg-gradient-to-br from-[#3c1d18] via-[#2e1310] to-[#1a0a09]',
    border: 'border-amber-500/50 hover:border-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    iconBg: 'bg-amber-600/30 text-amber-200 border-amber-400/40',
    textColor: 'text-amber-100'
  },
  {
    id: 'berry-velvet',
    name: 'توت فيلفيت',
    previewColor: '#d946ef',
    gradient: 'from-fuchsia-600 to-pink-700',
    cardBg: 'bg-gradient-to-br from-[#380e32] via-[#280924] to-[#180516]',
    border: 'border-fuchsia-500/50 hover:border-fuchsia-400',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    iconBg: 'bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-400/40',
    textColor: 'text-fuchsia-100'
  },
  {
    id: 'emerald-mint',
    name: 'زمرد مينت',
    previewColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    cardBg: 'bg-gradient-to-br from-[#0c2f25] via-[#09221b] to-[#051511]',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconBg: 'bg-emerald-600/30 text-emerald-200 border-emerald-400/40',
    textColor: 'text-emerald-100'
  },
  {
    id: 'royal-orchid',
    name: 'أوركيد ملكي',
    previewColor: '#8b5cf6',
    gradient: 'from-violet-600 to-purple-800',
    cardBg: 'bg-gradient-to-br from-[#2a134d] via-[#1e0d37] to-[#130724]',
    border: 'border-violet-500/50 hover:border-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    iconBg: 'bg-violet-600/30 text-violet-200 border-violet-400/40',
    textColor: 'text-violet-100'
  },
  {
    id: 'gold-champagne',
    name: 'شامبين ذهبي',
    previewColor: '#eab308',
    gradient: 'from-yellow-500 to-amber-600',
    cardBg: 'bg-gradient-to-br from-[#382b10] via-[#281e0a] to-[#171105]',
    border: 'border-yellow-500/50 hover:border-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    iconBg: 'bg-yellow-600/30 text-yellow-200 border-yellow-400/40',
    textColor: 'text-yellow-100'
  },
  {
    id: 'ruby-garnet',
    name: 'ياقوت أحمر',
    previewColor: '#e11d48',
    gradient: 'from-red-600 to-rose-700',
    cardBg: 'bg-gradient-to-br from-[#3b0d18] via-[#2a0810] to-[#1a0409]',
    border: 'border-red-500/50 hover:border-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    iconBg: 'bg-red-600/30 text-red-200 border-red-400/40',
    textColor: 'text-red-100'
  }
];

export function getCategoryTheme(colorOrId?: string, fallbackIndex = 0): CategoryTheme {
  if (colorOrId) {
    const found = CATEGORY_THEMES.find((t) => t.id === colorOrId);
    if (found) return found;

    // Handle legacy class or color names
    if (colorOrId.includes('blue')) {
      return CATEGORY_THEMES[1]; // Lavender/Purple
    }
    if (colorOrId.includes('rose') || colorOrId.includes('pink')) {
      return CATEGORY_THEMES[0]; // Rose gold
    }
    if (colorOrId.includes('amber') || colorOrId.includes('orange')) {
      return CATEGORY_THEMES[2]; // Peach Coral
    }
    if (colorOrId.includes('fuchsia')) {
      return CATEGORY_THEMES[3]; // Berry Velvet
    }
    if (colorOrId.includes('emerald') || colorOrId.includes('green')) {
      return CATEGORY_THEMES[4]; // Emerald Mint
    }
    if (colorOrId.includes('violet')) {
      return CATEGORY_THEMES[5]; // Royal Orchid
    }
  }

  const idx = Math.abs(fallbackIndex) % CATEGORY_THEMES.length;
  return CATEGORY_THEMES[idx];
}
