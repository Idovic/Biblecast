/* Utilitaires pour charger et rechercher dans la Bible */
import type { BibleData, VerseReference, SearchResult } from '@/types/bible';

let bibleCache: BibleData | null = null;

// Charger la Bible depuis le fichier JSON
export async function loadBible(): Promise<BibleData> {
  if (bibleCache) return bibleCache;
  const response = await fetch('/bible-fr.json');
  bibleCache = await response.json();
  return bibleCache!;
}

// Liste des 66 livres de la Bible (ordre canonique)
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

// Obtenir les chapitres d'un livre
export function getChapters(bible: BibleData, book: string): number[] {
  const bookData = bible[book];
  if (!bookData) return [];
  return Object.keys(bookData).map(Number).sort((a, b) => a - b);
}

// Obtenir les versets d'un chapitre
export function getVerses(bible: BibleData, book: string, chapter: number): number[] {
  const chapterData = bible[book]?.[String(chapter)];
  if (!chapterData) return [];
  return Object.keys(chapterData).map(Number).sort((a, b) => a - b);
}

// Obtenir le texte d'un verset
export function getVerseText(bible: BibleData, book: string, chapter: number, verse: number): string {
  return bible[book]?.[String(chapter)]?.[String(verse)] || '';
}

// Obtenir une référence complète
export function getVerse(bible: BibleData, book: string, chapter: number, verse: number): VerseReference | null {
  const text = getVerseText(bible, book, chapter, verse);
  if (!text) return null;
  return { book, chapter, verse, text };
}

// Formater la référence (ex: "Jean 3:16")
export function formatReference(ref: VerseReference): string {
  return `${ref.book} ${ref.chapter}:${ref.verse}`;
}

// Recherche par mot-clé ou référence directe (ex: "Jean 3:16"), limité à 50 résultats
export function searchBible(bible: BibleData, query: string, limit = 50): SearchResult[] {
  if (!query || query.length < 2) return [];

  // Détection de référence directe : "Livre chapitre:verset"
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
          results.push({
            book,
            chapter: Number(chapter),
            verse: Number(verse),
            text,
            highlight: text,
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}
