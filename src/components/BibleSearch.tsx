/* Composant de recherche et navigation biblique */
import { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, BookOpen, ListPlus, CheckSquare2, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { BibleData, VerseReference } from '@/types/bible';
import { BIBLE_BOOKS, getChapters, getVerses, getVerseText, searchBible } from '@/lib/bible';

interface BibleSearchProps {
  bible: BibleData | null;
  onSelectVerse: (verse: VerseReference) => void;
  onProjectVerse?: (verse: VerseReference) => void;
  onAddMultipleVerses?: (verses: VerseReference[]) => void;
}

export default function BibleSearch({ bible, onSelectVerse, onProjectVerse, onAddMultipleVerses }: BibleSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [mode, setMode] = useState<'books' | 'chapters' | 'verses' | 'search'>('books');
  const [multiSelected, setMultiSelected] = useState<Set<number>>(new Set());

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
    setMultiSelected(new Set());
  }, []);

  const handleChapterSelect = useCallback((chapter: number) => {
    setSelectedChapter(chapter);
    setMode('verses');
    setMultiSelected(new Set());
  }, []);

  const handleVerseSelect = useCallback((verseNum: number) => {
    if (!bible || !selectedBook || selectedChapter === null) return;
    const text = getVerseText(bible, selectedBook, selectedChapter, verseNum);
    onSelectVerse({ book: selectedBook, chapter: selectedChapter, verse: verseNum, text });
  }, [bible, selectedBook, selectedChapter, onSelectVerse]);

  const toggleVerseSelection = useCallback((verseNum: number) => {
    setMultiSelected(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (multiSelected.size === verses.length) {
      setMultiSelected(new Set());
    } else {
      setMultiSelected(new Set(verses));
    }
  }, [multiSelected.size, verses]);

  const handleAddMultipleToQueue = useCallback(() => {
    if (!bible || !selectedBook || selectedChapter === null || !onAddMultipleVerses) return;
    const refs: VerseReference[] = Array.from(multiSelected)
      .sort((a, b) => a - b)
      .map(v => ({
        book: selectedBook,
        chapter: selectedChapter,
        verse: v,
        text: getVerseText(bible, selectedBook, selectedChapter, v),
      }));
    onAddMultipleVerses(refs);
    setMultiSelected(new Set());
  }, [bible, selectedBook, selectedChapter, multiSelected, onAddMultipleVerses]);

  const availableBooks = useMemo(() => {
    if (!bible) return [];
    return BIBLE_BOOKS.filter(b => bible[b]);
  }, [bible]);

  const allSelected = verses.length > 0 && multiSelected.size === verses.length;

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

      {/* Navigation breadcrumb */}
      {mode !== 'books' && mode !== 'search' && (
        <div className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground border-b border-border">
          <button
            onClick={() => { setMode('books'); setSelectedBook(null); setSelectedChapter(null); setMultiSelected(new Set()); }}
            className="hover:text-primary transition-smooth"
          >
            Livres
          </button>
          {selectedBook && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => { setMode('chapters'); setSelectedChapter(null); setMultiSelected(new Set()); }}
                className="hover:text-primary transition-smooth"
              >
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

      {/* Toolbar multi-sélection en mode versets */}
      {mode === 'verses' && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-smooth"
          >
            {allSelected
              ? <CheckSquare2 className="h-3.5 w-3.5 text-primary" />
              : <Square className="h-3.5 w-3.5" />
            }
            Tout sélectionner
          </button>
          {multiSelected.size > 0 && (
            <span className="text-xs text-primary font-medium ml-auto">
              {multiSelected.size} sélectionné{multiSelected.size > 1 ? 's' : ''}
            </span>
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
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    onProjectVerse?.({ book: r.book, chapter: r.chapter, verse: r.verse, text: r.text });
                  }}
                  title="Clic : aperçu — Double-clic : projeter"
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

          {/* Liste des versets avec checkboxes */}
          {mode === 'verses' && bible && selectedBook && selectedChapter !== null && (
            <div className="space-y-1.5">
              {verses.map(v => {
                const text = getVerseText(bible, selectedBook, selectedChapter, v);
                const isSelected = multiSelected.has(v);
                return (
                  <div
                    key={v}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border transition-smooth ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/60 border-transparent hover:bg-surface-hover hover:border-primary/20'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleVerseSelection(v)}
                      className="mt-0.5 shrink-0"
                    />
                    <button
                      onClick={() => handleVerseSelect(v)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        if (onProjectVerse) {
                          onProjectVerse({ book: selectedBook!, chapter: selectedChapter!, verse: v, text });
                        }
                      }}
                      title="Clic : aperçu — Double-clic : projeter"
                      className="flex-1 text-left"
                    >
                      <span className="text-primary font-bold mr-2">{v}</span>
                      <span className="text-sm text-foreground">{text}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Barre d'action multi-sélection */}
      {mode === 'verses' && multiSelected.size > 0 && onAddMultipleVerses && (
        <div className="p-3 border-t border-border bg-primary/5">
          <Button onClick={handleAddMultipleToQueue} className="w-full gap-2 btn-gold rounded-lg">
            <ListPlus className="h-4 w-4" />
            Ajouter {multiSelected.size} verset{multiSelected.size > 1 ? 's' : ''} à la timeline
          </Button>
        </div>
      )}
    </div>
  );
}
