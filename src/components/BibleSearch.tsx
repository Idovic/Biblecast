/* Composant BibleSearch — navigation livre → chapitre → verset
   Nouvelles fonctionnalités: filtre A-Z, double version Bible, persistance état */
import { useState, useMemo, useCallback, useRef } from 'react';
import { Search, BookOpen, ChevronRight, ChevronLeft, BookMarked, Layers2, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BibleData, VerseReference } from '@/types/bible';
import { getChapters, getVerses, getVerseText, searchBible, BIBLE_BOOKS } from '@/lib/bible';

type View = 'books' | 'chapters' | 'verses' | 'search';

export interface BibleNavState {
  view: View;
  selectedBook: string | null;
  selectedChapter: number | null;
  searchQuery: string;
  alphaFilter: string | null;
}

interface BibleSearchProps {
  bible: BibleData | null;
  bible2?: BibleData | null;
  bible2Name?: string;
  navState?: BibleNavState;
  onNavStateChange?: (s: BibleNavState) => void;
  onSelectVerse: (verse: VerseReference) => void;
  onSelectVerse2?: (verse: VerseReference | null) => void;
  onProjectVerse?: (verse: VerseReference) => void;
  onAddMultipleVerses?: (verses: VerseReference[]) => void;
  currentProjectedVerse?: VerseReference | null;
}

const INITIAL_NAV: BibleNavState = { view: 'books', selectedBook: null, selectedChapter: null, searchQuery: '', alphaFilter: null };

const ALPHA_LETTERS = ['A', 'B', 'C', 'D', 'E', 'É', 'G', 'H', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'Z'];

export default function BibleSearch({
  bible, bible2, bible2Name = 'BDS',
  navState: externalNav, onNavStateChange,
  onSelectVerse, onSelectVerse2,
  onProjectVerse, onAddMultipleVerses,
  currentProjectedVerse,
}: BibleSearchProps) {
  const [internalNav, setInternalNav] = useState<BibleNavState>(INITIAL_NAV);
  const nav = externalNav ?? internalNav;

  const setNav = useCallback((update: Partial<BibleNavState> | ((prev: BibleNavState) => BibleNavState)) => {
    const next = typeof update === 'function' ? update(nav) : { ...nav, ...update };
    if (onNavStateChange) onNavStateChange(next);
    else setInternalNav(next);
  }, [nav, onNavStateChange]);

  const [dualMode, setDualMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<VerseReference[]>([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const hasBible2 = useMemo(() => bible2 ? Object.keys(bible2).length > 0 : false, [bible2]);

  const availableBooks = useMemo(() => {
    if (!bible) return [];
    return BIBLE_BOOKS.filter(b => bible[b]);
  }, [bible]);

  const filteredBooks = useMemo(() => {
    const base = nav.alphaFilter
      ? availableBooks.filter(b => {
          const first = b.replace(/^\d+\s*/, '')[0]?.toUpperCase();
          return first === nav.alphaFilter ||
            (nav.alphaFilter === 'É' && first === 'É');
        })
      : availableBooks;
    return base;
  }, [availableBooks, nav.alphaFilter]);

  const searchResults = useMemo(() => {
    if (nav.view !== 'search' || !bible || nav.searchQuery.length < 2) return [];
    return searchBible(bible, nav.searchQuery, 60);
  }, [bible, nav.searchQuery, nav.view]);

  const chapters = useMemo(() => {
    if (!bible || !nav.selectedBook) return [];
    return getChapters(bible, nav.selectedBook);
  }, [bible, nav.selectedBook]);

  const verses = useMemo(() => {
    if (!bible || !nav.selectedBook || !nav.selectedChapter) return [];
    return getVerses(bible, nav.selectedBook, nav.selectedChapter);
  }, [bible, nav.selectedBook, nav.selectedChapter]);

  const handleSelectVerse = useCallback((verse: VerseReference) => {
    onSelectVerse(verse);
    if (dualMode && hasBible2 && bible2) {
      const text2 = getVerseText(bible2, verse.book, verse.chapter, verse.verse);
      onSelectVerse2?.(text2 ? { ...verse, text: text2 } : null);
    } else {
      onSelectVerse2?.(null);
    }
  }, [onSelectVerse, onSelectVerse2, dualMode, hasBible2, bible2]);

  const handleDoubleClickVerse = useCallback((verse: VerseReference) => {
    handleSelectVerse(verse);
    onProjectVerse?.(verse);
  }, [handleSelectVerse, onProjectVerse]);

  const toggleMultiSelect = (verse: VerseReference) => {
    setSelectedVerses(prev =>
      prev.find(v => v.book === verse.book && v.chapter === verse.chapter && v.verse === verse.verse)
        ? prev.filter(v => !(v.book === verse.book && v.chapter === verse.chapter && v.verse === verse.verse))
        : [...prev, verse]
    );
  };

  if (!bible) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Chargement de la Bible…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Barre de navigation + recherche */}
      <div className="shrink-0 px-2 pt-2 pb-1 space-y-2">
        <div className="flex items-center gap-2">
          {/* Bouton retour */}
          {nav.view !== 'books' && nav.view !== 'search' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (nav.view === 'verses') setNav({ view: 'chapters' });
                else if (nav.view === 'chapters') setNav({ view: 'books', selectedBook: null });
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Fil d'Ariane */}
          <div className="flex-1 flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
            <button onClick={() => setNav({ view: 'books', selectedBook: null, selectedChapter: null })}
              className="hover:text-foreground transition-smooth shrink-0">
              <BookMarked className="h-3.5 w-3.5 inline mr-0.5" />Bibles
            </button>
            {nav.selectedBook && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => nav.view === 'verses' && setNav({ view: 'chapters', selectedChapter: null })}
                  className={cn('hover:text-foreground truncate transition-smooth', nav.view === 'chapters' && 'text-foreground font-medium')}
                >
                  {nav.selectedBook}
                </button>
              </>
            )}
            {nav.selectedChapter && nav.view === 'verses' && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground font-medium">Ch.{nav.selectedChapter}</span>
              </>
            )}
          </div>

          {/* Bouton double-version */}
          {hasBible2 && (
            <button
              onClick={() => {
                setDualMode(!dualMode);
                if (dualMode) onSelectVerse2?.(null);
              }}
              title={`Mode double version ${dualMode ? 'actif' : 'inactif'}`}
              className={cn(
                'h-7 px-2 rounded-lg border text-[10px] font-medium flex items-center gap-1 shrink-0 transition-all',
                dualMode
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers2 className="h-3 w-3" />
              {dualMode ? `FR + ${bible2Name}` : `+${bible2Name}`}
            </button>
          )}

          {/* Bouton recherche */}
          <button
            onClick={() => {
              if (nav.view === 'search') setNav({ view: 'books', searchQuery: '' });
              else { setNav({ view: 'search' }); setTimeout(() => searchRef.current?.focus(), 50); }
            }}
            className={cn('h-7 w-7 rounded-lg border flex items-center justify-center transition-smooth shrink-0',
              nav.view === 'search'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
            )}
            title="Recherche"
          >
            {nav.view === 'search' ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Barre de recherche */}
        {nav.view === 'search' && (
          <Input
            ref={searchRef}
            value={nav.searchQuery}
            onChange={e => setNav({ searchQuery: e.target.value })}
            placeholder="Recherche dans la Bible…"
            className="h-8 text-sm bg-secondary border-border/50"
          />
        )}

        {/* Filtre alphabétique (vue livres uniquement) */}
        {nav.view === 'books' && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setNav({ alphaFilter: null })}
              className={cn('px-2 py-0.5 rounded text-[10px] font-medium transition-smooth',
                !nav.alphaFilter ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >Tous</button>
            {ALPHA_LETTERS.map(l => (
              <button key={l}
                onClick={() => setNav({ alphaFilter: nav.alphaFilter === l ? null : l })}
                className={cn('px-2 py-0.5 rounded text-[10px] font-medium transition-smooth',
                  nav.alphaFilter === l ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >{l}</button>
            ))}
          </div>
        )}

        {/* Sélection multiple */}
        {nav.view === 'verses' && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-smooth',
            multiSelect ? 'bg-primary/10 border border-primary/30' : 'bg-transparent'
          )}>
            <button
              onClick={() => { setMultiSelect(!multiSelect); setSelectedVerses([]); }}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg border transition-smooth',
                multiSelect
                  ? 'border-primary/60 bg-primary/20 text-primary'
                  : 'border-border/50 bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary/90'
              )}
            >
              {multiSelect ? '✕ Annuler' : '☑ Sélection multiple'}
            </button>
            {multiSelect && selectedVerses.length > 0 && (
              <>
                <button
                  onClick={() => setSelectedVerses([])}
                  className="text-[10px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  Tout désélectionner
                </button>
                <button
                  onClick={() => { onAddMultipleVerses?.(selectedVerses); setSelectedVerses([]); setMultiSelect(false); }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter {selectedVerses.length}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Zone de contenu */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">

        {/* Vue : liste des livres */}
        {nav.view === 'books' && (
          <div className="grid grid-cols-2 gap-1.5">
            {filteredBooks.map(book => {
              const isNT = BIBLE_BOOKS.indexOf(book) >= 39;
              return (
                <button
                  key={book}
                  onClick={() => setNav({ view: 'chapters', selectedBook: book, selectedChapter: null, alphaFilter: null })}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary/80 hover:border-primary/30 transition-smooth text-left"
                >
                  <BookOpen className={cn('h-3.5 w-3.5 shrink-0', isNT ? 'text-blue-400' : 'text-amber-400')} />
                  <span className="text-xs text-foreground truncate font-medium">{book}</span>
                </button>
              );
            })}
            {filteredBooks.length === 0 && (
              <p className="col-span-2 text-center text-xs text-muted-foreground py-8">Aucun livre pour la lettre « {nav.alphaFilter} »</p>
            )}
          </div>
        )}

        {/* Vue : chapitres */}
        {nav.view === 'chapters' && nav.selectedBook && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground px-1">{nav.selectedBook}</h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
              {chapters.map(ch => (
                <button
                  key={ch}
                  onClick={() => setNav({ view: 'verses', selectedChapter: ch })}
                  className="h-10 rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary/80 hover:border-primary/30 text-sm font-medium text-foreground transition-smooth"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vue : versets */}
        {nav.view === 'verses' && nav.selectedBook && nav.selectedChapter && (
          <div className="space-y-1">
            {verses.map(v => {
              const text = getVerseText(bible!, nav.selectedBook!, nav.selectedChapter!, v);
              const ref: VerseReference = { book: nav.selectedBook!, chapter: nav.selectedChapter!, verse: v, text };
              const isProjected = currentProjectedVerse?.book === nav.selectedBook && currentProjectedVerse?.chapter === nav.selectedChapter && currentProjectedVerse?.verse === v;
              const isSelected = multiSelect && selectedVerses.some(sv => sv.verse === v);
              return (
                <button
                  key={v}
                  onClick={() => {
                    if (multiSelect) { toggleMultiSelect(ref); return; }
                    handleSelectVerse(ref);
                  }}
                  onDoubleClick={() => !multiSelect && handleDoubleClickVerse(ref)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg border transition-smooth',
                    isProjected ? 'border-primary/60 bg-primary/10' : isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('text-xs font-bold shrink-0 mt-0.5 w-6 text-right', isProjected ? 'text-primary' : 'text-muted-foreground')}>
                      {v}
                    </span>
                    <span className="text-xs text-foreground leading-relaxed flex-1">{text}</span>
                    {isProjected && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Vue : recherche */}
        {nav.view === 'search' && (
          <div className="space-y-1">
            {nav.searchQuery.length < 2 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Tapez au moins 2 caractères pour rechercher…</p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Aucun résultat pour « {nav.searchQuery} »</p>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground px-1 pb-1">{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</p>
                {searchResults.map((r, i) => {
                  const ref: VerseReference = { book: r.book, chapter: r.chapter, verse: r.verse, text: r.text };
                  return (
                    <button key={i}
                      onClick={() => handleSelectVerse(ref)}
                      onDoubleClick={() => handleDoubleClickVerse(ref)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-border/30 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/20 transition-smooth"
                    >
                      <div className="text-[10px] text-primary font-bold mb-1">{r.book} {r.chapter}:{r.verse}</div>
                      <div className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{r.text}</div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
