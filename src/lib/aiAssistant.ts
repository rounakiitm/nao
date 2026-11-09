import { ImportantEvent } from '../types';
import { getNextOccurrence, getMilestoneLabel } from './dateUtils';

const GEMINI_API_KEY_STORAGE = 'important_dates_gemini_api_key';

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  return stored || envKey;
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
}

export interface GeneratedWishes {
  heartfelt: string;
  playful: string;
  short: string;
  poetic: string;
}

export interface GiftIdea {
  title: string;
  description: string;
  estimatedBudget: string;
}

/**
 * Built-in local offline AI message generator (Works 100% without internet or API key!)
 */
export function generateLocalWishes(event: ImportantEvent): GeneratedWishes {
  const occ = getNextOccurrence(event);
  const milestone = getMilestoneLabel(event, occ.yearsCount);
  const name = event.person_name || event.title;

  if (event.category === 'Birthday') {
    return {
      heartfelt: `Happy Birthday, dearest ${name}! ❤️ Wishing you a day as wonderfully bright and kind as your heart. May this upcoming year bring you immense health, peace, and dreams fulfilled!`,
      playful: `Happy Birthday ${name}! 🎂 Another year wiser, bolder, and still not looking a day older! Time to celebrate like there's no tomorrow! 🎉🥳`,
      short: `Happy Birthday ${name}! Wishing you the very best today and always! 🎈🎉`,
      poetic: `Like a candle spreading golden glow, may your special day bring joy that continues to grow. Happy Birthday, dear ${name}! ✨🌷`,
    };
  }

  if (event.category === 'Anniversary' || event.category === 'Relationship') {
    return {
      heartfelt: `Happy Anniversary to both of you! ${milestone ? `Congratulations on ${milestone}! ` : ''}Your bond and love inspire everyone around you. Here's to many more chapters of joy and togetherness! 💍🥂`,
      playful: `Happy Anniversary! ${milestone ? `${milestone} of tolerating each other's jokes—that deserves an award! ` : ''}Keep laughing and loving together! 🥂🍰`,
      short: `Happy Anniversary ${name}! Wishing you endless love, happiness, and companionship! ❤️✨`,
      poetic: `Two hearts, one journey, woven in grace. May your love forever remain your happiest place. Happy Anniversary! 🕊️💖`,
    };
  }

  if (event.category === 'Memorial') {
    return {
      heartfelt: `Fondly remembering ${name} today. Those we hold closest in our hearts never truly leave us; they live on in our cherished memories and quiet prayers. 🕊️🕯️`,
      playful: `Thinking of the wonderful laughter, wisdom, and warm moments ${name} gifted to our lives. Always celebrated, never forgotten. ❤️`,
      short: `Forever in our hearts, thoughts, and prayers. Loving memories of ${name}. 🕯️`,
      poetic: `A gentle light that never fades, remembered through life's sun and shades. Peace and fond memories always. 🌸🕊️`,
    };
  }

  return {
    heartfelt: `Warmest congratulations on ${event.title}! Milestones like this remind us of how precious and meaningful the journey is. Wishing you great joy! 🏆✨`,
    playful: `Cheers to ${event.title}! Huge high five—you've earned this moment of celebration! 🚀🎉`,
    short: `Congratulations on ${event.title}! Proud of this milestone! 🌟`,
    poetic: `A step forward, a summit won, a testament to what heart has done. Celebrating ${event.title}! 🏆✨`,
  };
}

/**
 * Built-in local offline gift and celebration ideas
 */
export function generateLocalGiftIdeas(event: ImportantEvent): GiftIdea[] {
  const name = event.person_name || event.title;

  if (event.category === 'Birthday') {
    return [
      {
        title: 'Custom Photo Memory Frame / Album',
        description: `Create a mini album or framed collage capturing memorable highlights with ${name}.`,
        estimatedBudget: 'Under ₹500 - ₹1,000 / $15 - $25',
      },
      {
        title: 'Curated Wellness & Comfort Hamper',
        description: 'A basket with their favorite gourmet treats, artisanal teas or coffee, and cozy essentials.',
        estimatedBudget: '₹1,000 - ₹2,500 / $25 - $50',
      },
      {
        title: 'Surprise Experience or Dinner Outing',
        description: `Reserve a table at their favorite restaurant or plan an enjoyable weekend brunch together.`,
        estimatedBudget: 'Flexible',
      },
      {
        title: 'Handwritten Letter & Meaningful Keepsake',
        description: `A genuine, handwritten note sharing your favorite memories and what ${name} means to you.`,
        estimatedBudget: 'Priceless / Minimal cost',
      },
    ];
  }

  if (event.category === 'Anniversary') {
    return [
      {
        title: 'Romantic Candlelight Dinner or Staycation',
        description: 'Book a peaceful dinner or a short relaxing weekend retreat together away from daily chores.',
        estimatedBudget: '₹2,500 - ₹5,000 / $50 - $120',
      },
      {
        title: 'Custom Engraved Keepsake / Jewelry',
        description: 'A delicate bracelet, watch, or engraved wooden plague marking the wedding date.',
        estimatedBudget: '₹1,500 - ₹4,000 / $30 - $80',
      },
      {
        title: 'Recreate Your First Date or Memorable Moment',
        description: 'Visit the first spot you met or cook the special meal from your early days together.',
        estimatedBudget: 'Flexible',
      },
    ];
  }

  return [
    {
      title: 'Charitable Donation or Tree Planting in Their Honor',
      description: 'Plant a tree or support a noble cause that reflects their values and spirit.',
      estimatedBudget: 'Any meaningful amount',
    },
    {
      title: 'Personalized Journal or Keepsake',
      description: 'A high-quality leather-bound notebook or timeless bookmark.',
      estimatedBudget: 'Under ₹800 / $15',
    },
  ];
}

/**
 * If user configured a Gemini API Key, use real-time AI to generate hyper-personalized content!
 */
export async function generateGeminiAIWishes(event: ImportantEvent): Promise<GeneratedWishes | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const prompt = `You are a warm, thoughtful family AI assistant. Generate 4 distinct wishes for:
Event: ${event.title}
Person: ${event.person_name || 'Loved One'}
Category: ${event.category}
Relationship: ${event.relationship || 'Close family'}
Notes: ${event.notes || 'None'}

Return ONLY valid JSON in this exact structure:
{
  "heartfelt": "...",
  "playful": "...",
  "short": "...",
  "poetic": "..."
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (err) {
    console.error('Gemini API call failed, falling back to local AI:', err);
  }
  return null;
}

