import { EventCategory } from '../types';

export interface ParsedEvent {
  title: string;
  event_date: string;   // YYYY-MM-DD
  start_time?: string;  // HH:MM
  end_time?: string;
  location?: string;
  category: EventCategory;
  notes?: string;
}

export type ParseError =
  | 'NO_API_KEY'
  | 'UNSUPPORTED_TYPE'
  | 'FETCH_FAILED'
  | 'API_ERROR'
  | 'EMPTY_RESULT';

const EXTRACT_PROMPT = `You are a travel itinerary parser. Extract every trip event from this document.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.

Each event object:
{
  "title": "concise event name",
  "event_date": "YYYY-MM-DD",
  "start_time": "HH:MM (24h, omit if unknown)",
  "end_time":   "HH:MM (24h, omit if unknown)",
  "location":   "place name (omit if unknown)",
  "category":   "flight|hotel|excursion|transportation|dining|general",
  "notes":      "extra details (omit if none)"
}

Categorisation rules:
- flight        → flights, airports, airlines, boarding
- hotel         → hotels, accommodation, check-in/out, resorts
- excursion     → tours, safaris, snorkelling, sightseeing, activities
- transportation→ transfers, shuttles, car hire, buses, ferries
- dining        → meals, restaurants, dinner reservations
- general       → everything else

Assume year 2027 if not specified. Return [] if nothing can be extracted.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data-URL prefix (keep only the raw base64)
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function normaliseImage(mime: string): string {
  if (mime.includes('heic') || mime.includes('heif')) return 'image/jpeg';
  if (mime.includes('png')) return 'image/png';
  if (mime.includes('gif')) return 'image/gif';
  if (mime.includes('webp')) return 'image/webp';
  return 'image/jpeg';
}

function extractArray(text: string): ParsedEvent[] {
  try {
    const t = text.trim();
    if (t.startsWith('[')) return JSON.parse(t);
    const m = t.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return [];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function parseItineraryFile(
  file: File | null,
  uri: string | null,
  mimeType: string,
): Promise<ParsedEvent[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw Object.assign(new Error('No API key'), { code: 'NO_API_KEY' });

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  if (!isPdf && !isImage) throw Object.assign(new Error('Unsupported type'), { code: 'UNSUPPORTED_TYPE' });

  // ── Resolve base64 ────────────────────────────────────────────────────────
  let base64: string;
  let resolvedMime = mimeType;

  try {
    if (file instanceof File) {
      base64 = await blobToBase64(file);
    } else if (uri) {
      if (uri.startsWith('data:')) {
        // Already a data URL — strip prefix
        const commaIdx = uri.indexOf(',');
        base64 = commaIdx >= 0 ? uri.slice(commaIdx + 1) : uri;
        const m = uri.match(/data:([^;]+);/);
        if (m) resolvedMime = m[1];
      } else {
        // Fetch blob URL or remote URL
        const resp = await fetch(uri);
        const blob = await resp.blob();
        resolvedMime = blob.type || mimeType;
        base64 = await blobToBase64(blob);
      }
    } else {
      throw new Error('No source');
    }
  } catch (e: any) {
    if (e.code === 'NO_API_KEY') throw e;
    throw Object.assign(new Error('Fetch failed'), { code: 'FETCH_FAILED' });
  }

  // ── Build Anthropic content block ─────────────────────────────────────────
  const fileBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: normaliseImage(resolvedMime), data: base64 } };

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
  if (isPdf) headers['anthropic-beta'] = 'pdfs-2024-09-25';

  // ── Call API ──────────────────────────────────────────────────────────────
  let resp: Response;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: EXTRACT_PROMPT }] }],
      }),
    });
  } catch {
    throw Object.assign(new Error('Network error'), { code: 'API_ERROR' });
  }

  if (!resp.ok) throw Object.assign(new Error(`API ${resp.status}`), { code: 'API_ERROR' });

  const json = await resp.json();
  const text = json.content?.[0]?.text || '';
  return extractArray(text);
}
