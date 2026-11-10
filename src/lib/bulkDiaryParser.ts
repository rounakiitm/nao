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
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^date[:\s-]*/i, '').replace(/^[#\s*-]+/, '').trim();

  // Pattern 0: Unix epoch millisecond timestamp (e.g. 1712893821000 or 1712893821)
  if (/^\d{10,13}$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }

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
 * Strip HTML and XML tags, decode basic entities
 */
function cleanRichContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
 * Smart Bulk Parser for 250+ Diary entries pasted or loaded from a file.
 * Supports:
 * - Plain text with dates (e.g. 15-03-2024 ...)
 * - OnePlus / OxygenOS XML backup (OneplusNote.xml)
 * - JSON exports & backups
 * - Markdown / divider formats
 */
export function parseBulkDiaryText(rawText: string): ParsedBulkEntry[] {
  if (!rawText || !rawText.trim()) return [];
  const trimmedText = rawText.trim();

  // 1. Check for OnePlus XML backup format (<note> or <OneplusNote>)
  if (trimmedText.includes('<note') || trimmedText.includes('<OneplusNote') || trimmedText.includes('<rich_content>')) {
    const xmlEntries: ParsedBulkEntry[] = [];
    const noteRegex = /<note[\s\S]*?<\/note>/gi;
    const matches = trimmedText.match(noteRegex);

    if (matches && matches.length > 0) {
      for (const noteXml of matches) {
        const titleMatch = noteXml.match(/<title>([\s\S]*?)<\/title>/i);
        const contentMatch = noteXml.match(/<rich_content>([\s\S]*?)<\/rich_content>/i) || noteXml.match(/<content>([\s\S]*?)<\/content>/i);
        const timeMatch = noteXml.match(/<created_time>([\s\S]*?)<\/created_time>/i) || noteXml.match(/<date>([\s\S]*?)<\/date>/i);

        const rawTitle = titleMatch ? cleanRichContent(titleMatch[1]) : '';
        const rawContent = contentMatch ? cleanRichContent(contentMatch[1]) : '';
        const rawTime = timeMatch ? timeMatch[1].trim() : '';

        // Extract date from time or content
        let isoDate = normalizeDateStringToISO(rawTime) || 
                      normalizeDateStringToISO(rawTitle) || 
                      normalizeDateStringToISO(rawContent) || 
                      new Date().toISOString().slice(0, 10);

        if (rawContent || rawTitle) {
          xmlEntries.push({
            date: isoDate,
            title: rawTitle,
            content: rawContent || rawTitle,
            mood: inferMood(rawContent || rawTitle),
            isValid: Boolean(isoDate && (rawContent || rawTitle)),
            rawHeader: rawTime,
          });
        }
      }

      if (xmlEntries.length > 0) {
        return xmlEntries.sort((a, b) => b.date.localeCompare(a.date));
      }
    }
  }

  // 2. Check if rawText is JSON (direct export from notes or backup)
  try {
    const parsedJson = JSON.parse(trimmedText);
    let list: any[] = [];
    if (Array.isArray(parsedJson)) {
      list = parsedJson;
    } else if (parsedJson && typeof parsedJson === 'object') {
      if (Array.isArray(parsedJson.notes)) list = parsedJson.notes;
      else if (Array.isArray(parsedJson.data)) list = parsedJson.data;
      else if (Array.isArray(parsedJson.entries)) list = parsedJson.entries;
      else if (Array.isArray(parsedJson.diaryEntries)) list = parsedJson.diaryEntries;
    }

    if (list.length > 0) {
      return list
        .filter((item) => item && (item.date || item.content || item.text || item.rich_content || item.title))
        .map((item) => {
          const rawDateStr = String(item.date || item.created_time || item.timestamp || item.date_time || item.time || '');
          const isoDate = normalizeDateStringToISO(rawDateStr) || 
                          normalizeDateStringToISO(item.title || '') || 
                          new Date().toISOString().slice(0, 10);
          const content = cleanRichContent(item.content || item.rich_content || item.body || item.text || '');
          const title = cleanRichContent(item.title || '');

          return {
            date: isoDate,
            title: title,
            content: content || title,
            mood: (item.mood as DiaryMood) || inferMood(content || title),
            isValid: Boolean(isoDate && (content || title)),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {
    // Not raw JSON, proceed to text scanning
  }

  // 3. Plain Text / Markdown / Divider scanning
  const lines = trimmedText.split(/\r?\n/);
  const sections: { header: string; date: string; contentLines: string[] }[] = [];

  let currentSection: { header: string; date: string; contentLines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = cleanRichContent(line);

    // Check if line indicates a new date
    const detectedDate = normalizeDateStringToISO(trimmed);

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
      if (currentSection && currentSection.contentLines.join('\n').trim().length > 0) {
        sections.push(currentSection);
        currentSection = null;
      }
      continue;
    }

    if (currentSection) {
      currentSection.contentLines.push(trimmed);
    } else if (trimmed) {
      currentSection = {
        header: 'Diary Note',
        date: new Date().toISOString().slice(0, 10),
        contentLines: [trimmed],
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
