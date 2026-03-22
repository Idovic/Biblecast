/* Utilitaires pour charger et rechercher dans la Bible */
import type { BibleData, VerseReference, SearchResult } from '@/types/bible';

let bibleCache: BibleData | null = null;
let bdsCache: BibleData | null = null;

const BDS_STORAGE_KEY = 'biblecast:bds-data';

export async function loadBible(): Promise<BibleData> {
  if (bibleCache) return bibleCache;
  const response = await fetch(import.meta.env.BASE_URL + 'bible-fr.json');
  bibleCache = await response.json();
  return bibleCache!;
}

export async function loadBDS(): Promise<BibleData> {
  if (bdsCache !== null) return bdsCache;
  try {
    const stored = localStorage.getItem(BDS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BibleData;
      if (Object.keys(parsed).length > 0) {
        bdsCache = parsed;
        return bdsCache;
      }
    }
  } catch { }
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'bible-bds.json');
    const data = await response.json() as BibleData;
    bdsCache = data;
    return bdsCache;
  } catch {
    bdsCache = {};
    return {};
  }
}

export function importBDS(data: BibleData): void {
  try {
    localStorage.setItem(BDS_STORAGE_KEY, JSON.stringify(data));
    bdsCache = data;
  } catch { }
}

export function clearBDSCache(): void {
  bdsCache = null;
}

export const BIBLE_BOOKS = [
  'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome',
  'Josué', 'Juges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Rois', '2 Rois', '1 Chroniques', '2 Chroniques',
  'Esdras', 'Néhémie', 'Esther', 'Job', 'Psaumes', 'Proverbes',
  'Ecclésiaste', 'Cantique des Cantiques', 'Ésaïe', 'Jérémie',
  'Lamentations', 'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos',
  'Abdias', 'Jonas', 'Michée', 'Nahum', 'Habacuc', 'Sophonie',
  'Aggée', 'Zacharie', 'Malachie',
  'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes',
  'Romains', '1 Corinthiens', '2 Corinthiens', 'Galates', 'Éphésiens',
  'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens',
  '1 Timothée', '2 Timothée', 'Tite', 'Philémon', 'Hébreux',
  'Jacques', '1 Pierre', '2 Pierre', '1 Jean', '2 Jean', '3 Jean',
  'Jude', 'Apocalypse',
];

export function getChapters(bible: BibleData, book: string): number[] {
  const bookData = bible[book];
  if (!bookData) return [];
  return Object.keys(bookData).map(Number).sort((a, b) => a - b);
}

export function getVerses(bible: BibleData, book: string, chapter: number): number[] {
  const chapterData = bible[book]?.[String(chapter)];
  if (!chapterData) return [];
  return Object.keys(chapterData).map(Number).sort((a, b) => a - b);
}

export function getVerseText(bible: BibleData, book: string, chapter: number, verse: number): string {
  return bible[book]?.[String(chapter)]?.[String(verse)] || '';
}

export function getVerse(bible: BibleData, book: string, chapter: number, verse: number): VerseReference | null {
  const text = getVerseText(bible, book, chapter, verse);
  if (!text) return null;
  return { book, chapter, verse, text };
}

export function formatReference(ref: VerseReference): string {
  return `${ref.book} ${ref.chapter}:${ref.verse}`;
}

export function searchBible(bible: BibleData, query: string, limit = 50): SearchResult[] {
  if (!query || query.length < 2) return [];

  const refMatch = query.trim().match(/^(.+?)\s+(\d+):(\d+)\s*$/i);
  if (refMatch) {
    const bookQuery = refMatch[1].trim().toLowerCase();
    const chapter = parseInt(refMatch[2]);
    const verseNum = parseInt(refMatch[3]);
    const matchingBook = BIBLE_BOOKS.find(b =>
      b.toLowerCase() === bookQuery ||
      b.toLowerCase().startsWith(bookQuery) ||
      b.toLowerCase().replace(/\s/g, '').startsWith(bookQuery.replace(/\s/g, ''))
    );
    if (matchingBook) {
      const text = getVerseText(bible, matchingBook, chapter, verseNum);
      if (text) return [{ book: matchingBook, chapter, verse: verseNum, text, highlight: text }];
    }
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const book of Object.keys(bible)) {
    for (const chapter of Object.keys(bible[book])) {
      for (const verse of Object.keys(bible[book][chapter])) {
        const text = bible[book][chapter][verse];
        if (text.toLowerCase().includes(lowerQuery)) {
          results.push({ book, chapter: Number(chapter), verse: Number(verse), text, highlight: text });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}
