/* Page principale — Mode Présentateur (tablette) */
import { useState, useEffect, useCallback } from 'react';
import { Monitor, BookOpen, SlidersHorizontal, Layout, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BibleSearch from '@/components/BibleSearch';
import PreviewPanel from '@/components/PreviewPanel';
import QueuePanel from '@/components/QueuePanel';
import ThemePanel from '@/components/ThemePanel';
import SlidesEditor from '@/components/SlidesEditor';
import SettingsPanel from '@/components/SettingsPanel';
import { useBroadcastSender } from '@/hooks/useBroadcastChannel';
import { loadBible } from '@/lib/bible';
import type { BibleData, VerseReference, CustomSlide, QueueItem, DisplayTheme } from '@/types/bible';

export default function Index() {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<CustomSlide | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<QueueItem[]>([]);
  const [slides, setSlides] = useState<CustomSlide[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<DisplayTheme>({
    name: 'Noir classique',
    className: 'theme-noir-classique',
    fontSize: 'large',
    fontFamily: 'serif',
    bgOpacity: 1,
  });

  const send = useBroadcastSender();

  useEffect(() => {
    loadBible().then(setBible).catch(console.error);
  }, []);

  useEffect(() => {
    send({ type: 'theme-change', theme });
  }, [theme, send]);

  const handleSelectVerse = useCallback((verse: VerseReference) => {
    setSelectedVerse(verse);
    setSelectedSlide(null);
  }, []);

  const handleSelectSlide = useCallback((slide: CustomSlide) => {
    setSelectedSlide(slide);
    setSelectedVerse(null);
  }, []);

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

  const handleClearDisplay = useCallback(() => {
    send({ type: 'clear' });
  }, [send]);

  const handleSendQueueItem = useCallback((item: QueueItem) => {
    if (item.type === 'verse' && item.verse) {
      send({ type: 'show-verse', verse: item.verse });
      setSelectedVerse(item.verse);
      setSelectedSlide(null);
    } else if (item.type === 'slide' && item.slide) {
      send({ type: 'show-slide', slide: item.slide });
      setSelectedSlide(item.slide);
      setSelectedVerse(null);
    }
    setHistory(prev => [item, ...prev]);
    setQueue(prev => prev.filter(q => q.id !== item.id));
  }, [send]);

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

  return (
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-2 transition-smooth border border-border/50 hover:border-primary/30"
            onClick={() => window.open('/display', '_blank')}
          >
            <Monitor className="h-4 w-4" />
            Ouvrir l'écran
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panneau gauche — Recherche + Slides */}
        <div className="w-80 lg:w-96 border-r border-border flex flex-col shrink-0 glass-panel">
          <Tabs defaultValue="bible" className="flex flex-col h-full">
            <TabsList className="mx-3 mt-3 bg-secondary/80 backdrop-blur-sm">
              <TabsTrigger value="bible" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <BookOpen className="h-4 w-4" /> Bible
              </TabsTrigger>
              <TabsTrigger value="slides" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Layout className="h-4 w-4" /> Slides
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <SlidersHorizontal className="h-4 w-4" /> Thème
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bible" className="flex-1 mt-0 overflow-hidden">
              <BibleSearch bible={bible} onSelectVerse={handleSelectVerse} />
            </TabsContent>

            <TabsContent value="slides" className="flex-1 mt-0 overflow-hidden">
              <SlidesEditor
                slides={slides}
                onSlidesChange={setSlides}
                onSelectSlide={handleSelectSlide}
                onSendSlide={handleSendSlide}
              />
            </TabsContent>

            <TabsContent value="theme" className="flex-1 mt-0 overflow-hidden">
              <ThemePanel theme={theme} onChange={setTheme} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Panneau central — Prévisualisation */}
        <div className="flex-1 flex flex-col">
          <PreviewPanel
            selectedVerse={selectedVerse}
            selectedSlide={selectedSlide}
            onSendToDisplay={handleSendToDisplay}
            onAddToQueue={handleAddToQueue}
            onClearDisplay={handleClearDisplay}
          />
        </div>

        {/* Panneau droit — File d'attente + Historique */}
        <div className="w-72 lg:w-80 border-l border-border flex flex-col shrink-0 glass-panel">
          <QueuePanel
            queue={queue}
            history={history}
            onSendItem={handleSendQueueItem}
            onRemoveFromQueue={(id) => setQueue(prev => prev.filter(q => q.id !== id))}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onResend={handleResend}
          />
        </div>
      </div>

      {/* Modale Paramètres */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
