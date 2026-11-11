export type ThemeId = 'royal-purple' | 'midnight-dark' | 'emerald-vault' | 'sunset-rose' | 'clean-light';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  cardBg: string;
  headerBg: string;
  isDark: boolean;
}

export const AVAILABLE_THEMES: ThemeDefinition[] = [
  {
    id: 'royal-purple',
    name: 'Sacred Royal Purple',
    tagline: 'The original opulent amethyst & gold vault',
    emoji: '👑',
    primaryColor: '#581c87',
    accentColor: '#f59e0b',
    bgColor: '#fdfbf7',
    cardBg: '#ffffff',
    headerBg: '#181424',
    isDark: false,
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Obsidian',
    tagline: 'Deep OLED pure black with luminous gold',
    emoji: '🌑',
    primaryColor: '#6366f1',
    accentColor: '#fbbf24',
    bgColor: '#09090b',
    cardBg: '#18181b',
    headerBg: '#09090b',
    isDark: true,
  },
  {
    id: 'emerald-vault',
    name: 'Emerald Sanctuary',
    tagline: 'Serene forest green, tranquil & peaceful',
    emoji: '🌿',
    primaryColor: '#047857',
    accentColor: '#fbbf24',
    bgColor: '#f4fbf7',
    cardBg: '#ffffff',
    headerBg: '#06281e',
    isDark: false,
  },
  {
    id: 'sunset-rose',
    name: 'Sunset Rose Gold',
    tagline: 'Warm dusk coral, romantic & nostalgic',
    emoji: '🌅',
    primaryColor: '#be185d',
    accentColor: '#f97316',
    bgColor: '#fff5f7',
    cardBg: '#ffffff',
    headerBg: '#2c0d1c',
    isDark: false,
  },
  {
    id: 'clean-light',
    name: 'Minimal Porcelain',
    tagline: 'Clean, distraction-free modern clarity',
    emoji: '🕊️',
    primaryColor: '#0f172a',
    accentColor: '#d97706',
    bgColor: '#f8fafc',
    cardBg: '#ffffff',
    headerBg: '#ffffff',
    isDark: false,
  },
];

const THEME_STORAGE_KEY = 'nao_active_theme';

export function getSavedTheme(): ThemeId {
  if (typeof window === 'undefined') return 'royal-purple';
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
    return saved as ThemeId;
  }
  return 'royal-purple';
}

export function applyTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
  
  const theme = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];
  const root = document.documentElement;
  
  root.setAttribute('data-theme', themeId);
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update theme-color meta tag for mobile address bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.headerBg);
  }

  window.dispatchEvent(new CustomEvent('nao_theme_changed', { detail: themeId }));
}

