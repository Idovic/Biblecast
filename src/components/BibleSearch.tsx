/* Composant de recherche et navigation biblique */
import { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BibleData, VerseReference } from '@/types/bible';
import { BIBLE_BOOKS, getChapters, getVerses, getVerseText, searchBible, formatReference } from '@/lib/bible';

interface BibleSearchProps {
  bible: BibleData | null;
  onSelectVerse: (verse: VerseReference) => void;
}

export default function BibleSearch({ bible, onSelectVerse }: BibleSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<'books' | 'chapters' | 'verses' | 'search'>('books');

  const searchResults = useMemo(() => {
    if (!bible || searchQuery.length < 2) return [];
    return searchBible(bible, searchQuery);
  }, [bible, searchQuery]);

  const chapters = useMemo(() => {
    if (!bible || !selectedBook) return [];
    return getChapters(bible, selectedBook);
  }, [bible, selectedBook]);

  const verses = useMemo(() => {
    if (!bible || !selectedBook || selectedChapter === null) return [];
    return getVerses(bible, selectedBook, selectedChapter);
  }, [bible, selectedBook, selectedChapter]);

  const handleBookSelect = useCallback((book: string) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setMode('chapters');
  }, []);

  const handleChapterSelect = useCallback((chapter: number) => {
    setSelectedChapter(chapter);
    setMode('verses');
  }, []);

  const handleVerseSelect = useCallback((verseNum: number) => {
    if (!bible || !selectedBook || selectedChapter === null) return;
    const text = getVerseText(bible, selectedBook, selectedChapter, verseNum);
    onSelectVerse({ book: selectedBook, chapter: selectedChapter, verse: verseNum, text });
  }, [bible, selectedBook, selectedChapter, onSelectVerse]);

  const handleBack = () => {
    if (mode === 'verses') { setMode('chapters'); setSelectedChapter(null); }
    else if (mode === 'chapters') { setMode('books'); setSelectedBook(null); }
    else if (mode === 'search') { setMode('books'); setSearchQuery(''); }
  };

  const availableBooks = useMemo(() => {
    if (!bible) return [];
    return BIBLE_BOOKS.filter(b => bible[b]);
  }, [bible]);

  return (
    <div className="flex flex-col h-full">
      {/* Barre de recherche */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un verset..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length >= 2) setMode('search');
              else if (mode === 'search') setMode('books');
            }}
            className="pl-9 bg-secondary/80 border-border focus:border-primary/50 transition-smooth"
          />
        </div>
      </div>

      {/* Navigation / breadcrumb */}
      {mode !== 'books' && mode !== 'search' && (
        <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground border-b border-border">
          <button onClick={() => { setMode('books'); setSelectedBook(null); setSelectedChapter(null); }}
            className="hover:text-primary transition-smooth">
            Livres
          </button>
          {selectedBook && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button onClick={() => { setMode('chapters'); setSelectedChapter(null); }}
                className="hover:text-primary transition-smooth">
                {selectedBook}
              </button>
            </>
          )}
          {selectedChapter !== null && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">Chapitre {selectedChapter}</span>
            </>
          )}
        </div>
      )}

      {/* Contenu */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Mode recherche */}
          {mode === 'search' && (
            <div className="space-y-2">
              {searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-muted-foreground text-sm text-center py-4">Aucun résultat</p>
              )}
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onSelectVerse({ book: r.book, chapter: r.chapter, verse: r.verse, text: r.text })}
                  className="w-full text-left p-3 rounded-lg bg-secondary/60 hover:bg-surface-hover border border-transparent hover:border-primary/20 transition-smooth"
                >
                  <span className="text-primary font-semibold text-sm">
                    {r.book} {r.chapter}:{r.verse}
                  </span>
                  <p className="text-sm text-foreground mt-1 line-clamp-2">{r.text}</p>
                </button>
              ))}
            </div>
          )}

          {/* Liste des livres */}
          {mode === 'books' && (
            <div className="grid grid-cols-2 gap-2">
              {availableBooks.map(book => (
                <Button
                  key={book}
                  variant="secondary"
                  className="h-12 justify-start text-sm font-medium transition-smooth hover:border-primary/20 border border-transparent"
                  onClick={() => handleBookSelect(book)}
                >
                  <BookOpen className="h-4 w-4 mr-2 text-primary shrink-0" />
                  <span className="truncate">{book}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Liste des chapitres */}
          {mode === 'chapters' && (
            <div className="grid grid-cols-5 gap-2">
              {chapters.map(ch => (
                <Button
                  key={ch}
                  variant="secondary"
                  className="h-12 text-lg font-semibold transition-smooth hover:border-primary/20 border border-transparent hover:text-primary"
                  onClick={() => handleChapterSelect(ch)}
                >
                  {ch}
                </Button>
              ))}
            </div>
          )}

          {/* Liste des versets */}
          {mode === 'verses' && bible && selectedBook && selectedChapter !== null && (
            <div className="space-y-2">
              {verses.map(v => {
                const text = getVerseText(bible, selectedBook, selectedChapter, v);
                return (
                  <button
                    key={v}
                    onClick={() => handleVerseSelect(v)}
                    className="w-full text-left p-3 rounded-lg bg-secondary/60 hover:bg-surface-hover border border-transparent hover:border-primary/20 transition-smooth"
                  >
                    <span className="text-primary font-bold mr-2">{v}</span>
                    <span className="text-sm text-foreground">{text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
