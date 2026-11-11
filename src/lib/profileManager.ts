export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  vaultTitle: string;
  vaultTagline: string;
  role: 'owner' | 'member';
}

const PROFILE_STORAGE_KEY = 'nao_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Rounak',
  email: 'rounaksingh05555@gmail.com',
  avatar: '👑',
  bio: 'Keeper of sacred milestones, personal reflections, and family memories.',
  vaultTitle: 'nao',
  vaultTagline: 'Sacred personal dates & memories',
  role: 'owner',
};

export const AVATAR_OPTIONS = [
  '👑', '🦁', '🌟', '🚀', '🦅', '🌿', '💎', '🔥', '✨', '⚡', '🌙', '🕊️'
];

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated: UserProfile = { ...current, ...profile };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nao_profile_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
  return updated;
}

