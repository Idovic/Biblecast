/* Page principale — Mode Présentateur */
import { useState, useEffect, useCallback } from 'react';
import { Monitor, BookOpen, Image, Layout, Settings, Keyboard } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BibleSearch from '@/components/BibleSearch';
import PreviewPanel from '@/components/PreviewPanel';
import QueuePanel from '@/components/QueuePanel';
import GalleryPanel from '@/components/GalleryPanel';
import SlidesEditor from '@/components/SlidesEditor';
import SettingsPanel from '@/components/SettingsPanel';
import CastButton from '@/components/CastButton';
import SplashScreen from '@/components/SplashScreen';
import { useBroadcastSender } from '@/hooks/useBroadcastChannel';
import { usePeerHost } from '@/hooks/usePeerSync';
import { loadBible } from '@/lib/bible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { BibleData, VerseReference, CustomSlide, QueueItem, DisplayTheme } from '@/types/bible';

function ColResizeHandle() {
  const [dragging, setDragging] = useState(false);
  return (
    <PanelResizeHandle
      onDragging={setDragging}
      className={cn(
        'group relative flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors z-10',
        'w-[6px]',
        dragging ? 'bg-primary/10' : 'bg-transparent hover:bg-primary/[0.07]'
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-all duration-150',
          dragging ? 'bg-primary/70' : 'bg-border group-hover:bg-primary/50'
        )}
      />
      <div
        className={cn(
          'relative z-10 flex flex-col gap-[3px] transition-opacity duration-150',
          dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            className={cn(
              'block w-1 h-1 rounded-full transition-colors',
              dragging ? 'bg-primary' : 'bg-primary/60'
            )}
          />
        ))}
      </div>
    </PanelResizeHandle>
  );
}

export default function Index() {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [bibleLoading, setBibleLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<CustomSlide | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<QueueItem[]>([]);
  const [slides, setSlides] = useState<CustomSlide[]>(() => {
    try { return JSON.parse(localStorage.getItem('biblecast:slides') || '[]'); }
    catch { return []; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [currentTimelineId, setCurrentTimelineId] = useState<string | null>(null);
  const [theme, setTheme] = useState<DisplayTheme>({
    name: 'Noir classique',
    className: 'theme-noir-classique',
    fontSize: 'large',
    fontFamily: 'serif',
    bgOpacity: 1,
  });

  const peer = usePeerHost();
  const send = useBroadcastSender(peer.peerSend);
  const { toast } = useToast();

  useEffect(() => {
    setBibleLoading(true);
    loadBible()
      .then(data => {
        setBible(data);
        setBibleLoading(false);
      })
      .catch(err => {
        console.error(err);
        setBibleLoading(false);
      });
  }, []);

  useEffect(() => {
    send({ type: 'theme-change', theme });
  }, [theme, send]);

  useEffect(() => {
    localStorage.setItem('biblecast:slides', JSON.stringify(slides));
  }, [slides]);

  const handleSelectVerse = useCallback((verse: VerseReference) => {
    setSelectedVerse(verse);
    setSelectedSlide(null);
  }, []);

  const handleSelectSlide = useCallback((slide: CustomSlide) => {
    setSelectedSlide(slide);
    setSelectedVerse(null);
  }, []);

  /* Projection immédiate (double-clic / raccourci) */
  const handleProjectVerse = useCallback((verse: VerseReference) => {
    send({ type: 'show-verse', verse });
    setSelectedVerse(verse);
    setSelectedSlide(null);
    const item: QueueItem = { id: crypto.randomUUID(), type: 'verse', verse };
    setHistory(prev => [item, ...prev]);
    toast({
      title: `${verse.book} ${verse.chapter}:${verse.verse}`,
      description: 'Projeté sur l\'écran',
      duration: 1800,
    });
  }, [send, toast]);

  const handleSendToDisplay = useCallback(() => {
    if (selectedVerse) {
      send({ type: 'show-verse', verse: selectedVerse });
      const item: QueueItem = { id: crypto.randomUUID(), type: 'verse', verse: selectedVerse };
      setHistory(prev => [item, ...prev]);
    } else if (selectedSlide) {
      send({ type: 'show-slide', slide: selectedSlide });
      const item: QueueItem = { id: crypto.randomUUID(), type: 'slide', slide: selectedSlide };
      setHistory(prev => [item, ...prev]);
    }
  }, [selectedVerse, selectedSlide, send]);

  const handleAddToQueue = useCallback(() => {
    if (selectedVerse) {
      setQueue(prev => [...prev, { id: crypto.randomUUID(), type: 'verse', verse: selectedVerse }]);
    } else if (selectedSlide) {
      setQueue(prev => [...prev, { id: crypto.randomUUID(), type: 'slide', slide: selectedSlide }]);
    }
  }, [selectedVerse, selectedSlide]);

  const handleAddMultipleVerses = useCallback((verses: VerseReference[]) => {
    const items: QueueItem[] = verses.map(v => ({
      id: crypto.randomUUID(),
      type: 'verse' as const,
      verse: v,
    }));
    setQueue(prev => [...prev, ...items]);
  }, []);

  const handleClearDisplay = useCallback(() => {
    send({ type: 'clear' });
  }, [send]);

  const handleTimelineSendItem = useCallback((item: QueueItem) => {
    if (item.type === 'verse' && item.verse) {
      send({ type: 'show-verse', verse: item.verse });
      setSelectedVerse(item.verse);
      setSelectedSlide(null);
    } else if (item.type === 'slide' && item.slide) {
      send({ type: 'show-slide', slide: item.slide });
      setSelectedSlide(item.slide);
      setSelectedVerse(null);
    }
    setCurrentTimelineId(item.id);
    setHistory(prev => [item, ...prev]);
  }, [send]);

  const handleTimelineNext = useCallback(() => {
    const nonSection = queue.filter(q => q.type !== 'section');
    if (nonSection.length === 0) return;
    if (!currentTimelineId) {
      handleTimelineSendItem(nonSection[0]);
      return;
    }
    const idx = nonSection.findIndex(q => q.id === currentTimelineId);
    if (idx < nonSection.length - 1) handleTimelineSendItem(nonSection[idx + 1]);
  }, [queue, currentTimelineId, handleTimelineSendItem]);

  const handleTimelinePrev = useCallback(() => {
    const nonSection = queue.filter(q => q.type !== 'section');
    if (!currentTimelineId) return;
    const idx = nonSection.findIndex(q => q.id === currentTimelineId);
    if (idx > 0) handleTimelineSendItem(nonSection[idx - 1]);
  }, [queue, currentTimelineId, handleTimelineSendItem]);

  const handleRemoveFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    if (currentTimelineId === id) setCurrentTimelineId(null);
  }, [currentTimelineId]);

  const handleMoveUp = useCallback((id: string) => {
    setQueue(prev => {
      const i = prev.findIndex(q => q.id === id);
      if (i <= 0) return prev;
      const arr = [...prev];
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      return arr;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setQueue(prev => {
      const i = prev.findIndex(q => q.id === id);
      if (i < 0 || i >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr;
    });
  }, []);

  const handleResend = useCallback((item: QueueItem) => {
    if (item.type === 'verse' && item.verse) {
      send({ type: 'show-verse', verse: item.verse });
      setSelectedVerse(item.verse);
      setSelectedSlide(null);
    } else if (item.type === 'slide' && item.slide) {
      send({ type: 'show-slide', slide: item.slide });
      setSelectedSlide(item.slide);
      setSelectedVerse(null);
    }
  }, [send]);

  const handleSendSlide = useCallback((slide: CustomSlide) => {
    send({ type: 'show-slide', slide });
    setSelectedSlide(slide);
    setSelectedVerse(null);
    const item: QueueItem = { id: crypto.randomUUID(), type: 'slide', slide };
    setHistory(prev => [item, ...prev]);
  }, [send]);

  const handleAddSection = useCallback((name: string, color: string) => {
    setQueue(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'section',
      sectionName: name,
      sectionColor: color,
    }]);
  }, []);

  const handleApplyToSlide = useCallback((imageUrl: string) => {
    if (!selectedSlide) return;
    const updated = { ...selectedSlide, backgroundImage: imageUrl };
    setSlides(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedSlide(updated);
  }, [selectedSlide]);

  const handleSetVerseBackground = useCallback((imageUrl: string | undefined) => {
    setTheme(t => ({ ...t, verseBackgroundImage: imageUrl }));
  }, []);

  const handleSetLogo = useCallback((show: boolean) => {
    setTheme(t => ({ ...t, showChurchLogo: show }));
  }, []);

  /* Raccourcis clavier globaux */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSendToDisplay();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleTimelineNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handleTimelinePrev();
          break;
        case 'Escape':
          e.preventDefault();
          handleClearDisplay();
          break;
        case '?':
          setShowShortcuts(v => !v);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSendToDisplay, handleTimelineNext, handleTimelinePrev, handleClearDisplay]);

  return (
    <>
      <SplashScreen loading={bibleLoading} />

      <div className="h-screen flex flex-col overflow-hidden">
        {/* Barre supérieure */}
        <header className="h-14 flex items-center px-4 border-b border-border shrink-0 glass-panel">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">BibleCast</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <CastButton
              roomCode={peer.roomCode}
              displayUrl={peer.displayUrl}
              connectedCount={peer.connectedCount}
              isReady={peer.isReady}
            />
            <Button
              size="sm" variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground transition-smooth"
              onClick={() => setShowShortcuts(v => !v)}
              title="Raccourcis clavier (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              size="sm" variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground transition-smooth"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm" variant="secondary"
              className="gap-2 transition-smooth border border-border/50 hover:border-primary/30"
              onClick={() => window.open('/display', '_blank')}
            >
              <Monitor className="h-4 w-4" />
              Ouvrir l'écran
            </Button>
          </div>
        </header>

        {/* Panneau raccourcis */}
        {showShortcuts && (
          <div className="border-b border-border bg-secondary/40 px-6 py-2.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground shrink-0">
            {[
              ['Entrée', 'Projeter l\'aperçu'],
              ['→ / ↓', 'Suivant (timeline)'],
              ['← / ↑', 'Précédent (timeline)'],
              ['Échap', 'Effacer l\'écran'],
              ['Double-clic', 'Projeter un verset'],
              ['?', 'Afficher/masquer ce panneau'],
            ].map(([key, desc]) => (
              <span key={key}>
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground font-mono text-[10px]">{key}</kbd>
                <span className="ml-1.5">{desc}</span>
              </span>
            ))}
          </div>
        )}

        {/* Contenu principal — panneaux redimensionnables */}
        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">

          {/* Panneau gauche — Bible / Slides / Galerie */}
          <Panel
            defaultSize={23}
            minSize={14}
            maxSize={45}
            className="flex flex-col glass-panel overflow-hidden"
          >
            <Tabs defaultValue="bible" className="flex flex-col h-full">
              <TabsList className="mx-3 mt-3 bg-secondary/80 backdrop-blur-sm shrink-0">
                <TabsTrigger value="bible" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <BookOpen className="h-4 w-4" /> Bible
                </TabsTrigger>
                <TabsTrigger value="slides" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Layout className="h-4 w-4" /> Slides
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Image className="h-4 w-4" /> Galerie
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bible" className="flex-1 mt-0 overflow-hidden">
                <BibleSearch
                  bible={bible}
                  onSelectVerse={handleSelectVerse}
                  onProjectVerse={handleProjectVerse}
                  onAddMultipleVerses={handleAddMultipleVerses}
                />
              </TabsContent>

              <TabsContent value="slides" className="flex-1 mt-0 overflow-hidden">
                <SlidesEditor
                  slides={slides}
                  onSlidesChange={setSlides}
                  onSelectSlide={handleSelectSlide}
                  onSendSlide={handleSendSlide}
                />
              </TabsContent>

              <TabsContent value="gallery" className="flex-1 mt-0 overflow-hidden">
                <GalleryPanel
                  selectedSlide={selectedSlide}
                  theme={theme}
                  onApplyToSlide={handleApplyToSlide}
                  onSetVerseBackground={handleSetVerseBackground}
                  onSetLogo={handleSetLogo}
                  onThemeChange={setTheme}
                />
              </TabsContent>
            </Tabs>
          </Panel>

          <ColResizeHandle />

          {/* Panneau central — Prévisualisation */}
          <Panel defaultSize={54} minSize={25} className="flex flex-col overflow-hidden">
            <PreviewPanel
              selectedVerse={selectedVerse}
              selectedSlide={selectedSlide}
              onSendToDisplay={handleSendToDisplay}
              onAddToQueue={handleAddToQueue}
              onClearDisplay={handleClearDisplay}
              theme={theme}
              onThemeChange={setTheme}
            />
          </Panel>

          <ColResizeHandle />

          {/* Panneau droit — Timeline + Historique */}
          <Panel
            defaultSize={23}
            minSize={14}
            maxSize={40}
            className="flex flex-col glass-panel overflow-hidden"
          >
            <QueuePanel
              queue={queue}
              history={history}
              currentId={currentTimelineId}
              onSendItem={handleTimelineSendItem}
              onRemoveFromQueue={handleRemoveFromQueue}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onResend={handleResend}
              onNext={handleTimelineNext}
              onPrev={handleTimelinePrev}
              onAddSection={handleAddSection}
            />
          </Panel>

        </PanelGroup>

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>
    </>
  );
}
