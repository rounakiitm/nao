import { DiaryEntry, DiaryMood } from '../types';

export interface ParsedBulkEntry {
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: DiaryMood;
  isValid: boolean;
  rawHeader?: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Normalizes various human dates to standard ISO 'YYYY-MM-DD'
 */
export function normalizeDateStringToISO(raw: string): string | null {
  const trimmed = raw.trim().replace(/^date[:\s-]*/i, '').replace(/^[#\s*-]+/, '').trim();

  // Pattern 1: ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Pattern 3: "15 March 2024", "15th March 2024", "15 Mar, 2024"
  const wordMatch1 = trimmed.match(/\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(20\d{2})\b/);
  if (wordMatch1) {
    const d = wordMatch1[1].padStart(2, '0');
    const monthKey = wordMatch1[2].toLowerCase();
    const y = wordMatch1[3];
    const m = MONTH_NAMES[monthKey];
    if (m) return `${y}-${m}-${d}`;
  }

  // Pattern 4: "March 15, 2024" or "Mar 15 2024"
  const wordMatch2 = trimmed.match(/\b([A-Za-z]+)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(20\d{2})\b/);
  if (wordMatch2) {
    const monthKey = wordMatch2[1].toLowerCase();
    const d = wordMatch2[2].padStart(2, '0');
    const y = wordMatch2[3];
    const m = MONTH_NAMES[monthKey];
    if (m) return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Detect mood from keywords in content
 */
function inferMood(text: string): DiaryMood {
  const lower = text.toLowerCase();
  if (lower.includes('great') || lower.includes('awesome') || lower.includes('amazing') || lower.includes('excited') || lower.includes('celebrat')) {
    return 'great';
  }
  if (lower.includes('happy') || lower.includes('joy') || lower.includes('smile') || lower.includes('fun') || lower.includes('good day')) {
    return 'happy';
  }
  if (lower.includes('peace') || lower.includes('calm') || lower.includes('quiet') || lower.includes('relax') || lower.includes('grateful') || lower.includes('gratitude')) {
    return 'peaceful';
  }
  if (lower.includes('tired') || lower.includes('difficult') || lower.includes('hard') || lower.includes('struggle') || lower.includes('challenge') || lower.includes('stress')) {
    return 'challenging';
  }
  return 'thoughtful';
}

/**
 * Smart Bulk Parser for 250+ Diary entries pasted or loaded from a file
 */
export function parseBulkDiaryText(rawText: string): ParsedBulkEntry[] {
  if (!rawText || !rawText.trim()) return [];

  // Check if rawText is JSON (direct export from notes or backup)
  try {
    const parsedJson = JSON.parse(rawText.trim());
    if (Array.isArray(parsedJson)) {
      return parsedJson
        .filter((item) => item && (item.date || item.content))
        .map((item) => {
          const isoDate = normalizeDateStringToISO(item.date || '') || new Date().toISOString().slice(0, 10);
          return {
            date: isoDate,
            title: item.title || '',
            content: item.content || item.body || item.text || '',
            mood: (item.mood as DiaryMood) || inferMood(item.content || ''),
            isValid: Boolean(isoDate && (item.content || item.body || item.text)),
          };
        });
    }
  } catch {
    // Not raw JSON, proceed to text scanning
  }

  const lines = rawText.split(/\r?\n/);
  const sections: { header: string; date: string; contentLines: string[] }[] = [];

  let currentSection: { header: string; date: string; contentLines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line indicates a new date or entry divider
    const detectedDate = normalizeDateStringToISO(trimmed);

    // If line has a date, or is a header like "### 2024-04-12" or "Date: 12-04-2024" or "Day 1: 12/04/2024"
    if (detectedDate) {
      if (currentSection && currentSection.contentLines.join('\n').trim().length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        header: trimmed,
        date: detectedDate,
        contentLines: [],
      };
      continue;
    }

    // Check for divider-based format (e.g. "---" or "====")
    if (trimmed.match(/^[=\-_*]{3,}$/)) {
      // Divider line
      if (currentSection && currentSection.contentLines.join('\n').trim().length > 0) {
        sections.push(currentSection);
        currentSection = null;
      }
      continue;
    }

    if (currentSection) {
      currentSection.contentLines.push(line);
    } else if (trimmed) {
      // Unassigned line before any date header — start an entry with today or try to infer
      currentSection = {
        header: 'Diary Note',
        date: new Date().toISOString().slice(0, 10),
        contentLines: [line],
      };
    }
  }

  if (currentSection && currentSection.contentLines.join('\n').trim().length > 0) {
    sections.push(currentSection);
  }

  // Convert sections into ParsedBulkEntry
  const results: ParsedBulkEntry[] = sections.map((sec) => {
    const fullText = sec.contentLines.join('\n').trim();
    const firstLineBreak = fullText.indexOf('\n');
    let title = '';
    let content = fullText;

    // If first line is short (<60 chars), treat it as a title
    if (firstLineBreak > 0 && firstLineBreak < 60) {
      const candidateTitle = fullText.slice(0, firstLineBreak).trim();
      if (!candidateTitle.includes('http') && candidateTitle.length > 2) {
        title = candidateTitle.replace(/^#+\s*/, '');
        content = fullText.slice(firstLineBreak + 1).trim();
      }
    }

    return {
      date: sec.date,
      title: title,
      content: content || fullText,
      mood: inferMood(content || fullText),
      isValid: Boolean(sec.date && (content || fullText)),
      rawHeader: sec.header,
    };
  });

  // Sort descending by date
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Converts parsed bulk entries into final DiaryEntry array
 */
export function convertToDiaryEntries(parsedList: ParsedBulkEntry[]): DiaryEntry[] {
  return parsedList
    .filter((p) => p.isValid && p.content)
    .map((p, idx) => ({
      id: `diary-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      date: p.date,
      title: p.title || '',
      content: p.content,
      mood: p.mood,
      photos: [],
      created_at: new Date().toISOString(),
    }));
}
