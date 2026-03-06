/* Timeline de présentation — versets, slides et sections */
import { useState, useRef } from 'react';
import { X, Send, Clock, ChevronLeft, ChevronRight, Layers, History, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { QueueItem, SlideType } from '@/types/bible';
import { formatReference } from '@/lib/bible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface QueuePanelProps {
  queue: QueueItem[];
  history: QueueItem[];
  currentId: string | null;
  onSendItem: (item: QueueItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onResend: (item: QueueItem) => void;
  onNext: () => void;
  onPrev: () => void;
  onAddSection: (name: string, color: string) => void;
  onQueueReorder?: (fromIndex: number, toIndex: number) => void;
}

const SECTION_COLORS = ['#f4a261', '#e63946', '#457b9d', '#2a9d8f', '#8338ec', '#fb8500'];

const TYPE_COLORS: Record<SlideType, string> = {
  'text-title': 'text-blue-400',
  'title-only': 'text-purple-400',
  'verse-title': 'text-primary',
  'blank': 'text-gray-400',
  'bullet-list': 'text-green-400',
};

function getItemLabel(item: QueueItem): string {
  if (item.type === 'verse' && item.verse) return formatReference(item.verse);
  if (item.type === 'slide' && item.slide) return item.slide.title || 'Slide sans titre';
  if (item.type === 'section') return item.sectionName || 'Section';
  return '—';
}

function getItemPreview(item: QueueItem): string {
  if (item.type === 'verse' && item.verse) return item.verse.text;
  if (item.type === 'slide' && item.slide) {
    if (item.slide.slideType === 'bullet-list') {
      return (item.slide.bullets || []).filter(Boolean).join(' · ');
    }
    return item.slide.content || '';
  }
  return '';
}

function getItemTypeColor(item: QueueItem): string {
  if (item.type === 'verse') return 'text-primary';
  if (item.type === 'slide' && item.slide?.slideType) {
    return TYPE_COLORS[item.slide.slideType] || 'text-muted-foreground';
  }
  return 'text-muted-foreground';
}

function getItemTypeLabel(item: QueueItem): string {
  if (item.type === 'verse') return 'Verset';
  if (item.type === 'slide') return 'Slide';
  return '';
}

export default function QueuePanel({
  queue, history, currentId, onSendItem, onRemoveFromQueue,
  onMoveUp, onMoveDown, onResend, onNext, onPrev, onAddSection, onQueueReorder
}: QueuePanelProps) {
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionColor, setSectionColor] = useState(SECTION_COLORS[0]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  const nonSectionItems = queue.filter(q => q.type !== 'section');
  const currentIdx = currentId ? nonSectionItems.findIndex(q => q.id === currentId) : -1;
  const totalItems = nonSectionItems.length;

  const handleAddSection = () => {
    if (!sectionName.trim()) return;
    onAddSection(sectionName.trim(), sectionColor);
    setSectionName('');
    setShowSectionForm(false);
  };

  const handleDragStart = (id: string) => { dragItemRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    const fromId = dragItemRef.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const fromIndex = queue.findIndex(q => q.id === fromId);
    const toIndex = queue.findIndex(q => q.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) onQueueReorder?.(fromIndex, toIndex);
    setDragOverId(null);
    dragItemRef.current = null;
  };
  const handleDragEnd = () => { setDragOverId(null); dragItemRef.current = null; };

  return (
    <Tabs defaultValue="timeline" className="flex flex-col h-full">
      <TabsList className="mx-3 mt-3 bg-secondary/80 backdrop-blur-sm">
        <TabsTrigger value="timeline" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <Layers className="h-4 w-4" /> Timeline ({totalItems})
        </TabsTrigger>
        <TabsTrigger value="history" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <History className="h-4 w-4" /> Historique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="timeline" className="flex-1 mt-0 overflow-hidden flex flex-col">
        {/* Barre de navigation manuelle */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
          <Button
            size="sm" variant="secondary"
            onClick={onPrev}
            disabled={currentIdx <= 0}
            className="h-8 w-8 p-0"
            title="Précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground">
              {currentIdx >= 0 ? `${currentIdx + 1} / ${totalItems}` : `— / ${totalItems}`}
            </span>
          </div>
          <Button
            size="sm" variant="secondary"
            onClick={onNext}
            disabled={totalItems === 0 || currentIdx >= totalItems - 1}
            className="h-8 w-8 p-0"
            title="Suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm" variant="secondary"
            onClick={() => setShowSectionForm(v => !v)}
            className="h-8 w-8 p-0 ml-1"
            title="Ajouter une section"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Formulaire ajout section */}
        {showSectionForm && (
          <div className="px-3 py-2.5 border-b border-border bg-secondary/30 space-y-2">
            <Input
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSection()}
              placeholder="Nom de la section (ex: Louange)"
              className="bg-secondary h-8 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              {SECTION_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSectionColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    sectionColor === c ? 'border-white scale-125' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="flex-1" />
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                onClick={() => setShowSectionForm(false)}>Annuler</Button>
              <Button size="sm" className="h-7 text-xs px-3 btn-gold"
                onClick={handleAddSection} disabled={!sectionName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {queue.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">
                Timeline vide.<br />Ajoutez des versets ou des slides.
              </p>
            )}

            {queue.map((item) => {
              /* --- Section divider --- */
              if (item.type === 'section') {
                return (
                  <div key={item.id} className="flex items-center gap-2 py-1 group">
                    <div className="flex-1 h-px opacity-40" style={{ backgroundColor: item.sectionColor || '#f4a261' }} />
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded border"
                      style={{ color: item.sectionColor || '#f4a261', borderColor: item.sectionColor || '#f4a261' }}
                    >
                      {item.sectionName}
                    </span>
                    <div className="flex-1 h-px opacity-40" style={{ backgroundColor: item.sectionColor || '#f4a261' }} />
                    <button
                      onClick={() => onRemoveFromQueue(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-smooth opacity-0 group-hover:opacity-100 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }

              /* --- Verset ou Slide --- */
              const isCurrent = item.id === currentId;
              const typeColor = getItemTypeColor(item);
              const typeLabel = getItemTypeLabel(item);
              const isDragOver = dragOverId === item.id;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={() => handleDrop(item.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-start gap-1.5 p-2.5 rounded-lg border transition-all group select-none',
                    isCurrent
                      ? 'bg-primary/15 border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
                      : 'bg-secondary/60 border-transparent hover:border-primary/15',
                    isDragOver && 'border-primary border-dashed opacity-60'
                  )}
                >
                  {/* Grip drag handle */}
                  <div className="flex items-center mt-1 cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {isCurrent && (
                    <span className="text-primary mt-1 shrink-0">▶</span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-medium ${typeColor}`}>{typeLabel}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-primary">• EN COURS</span>
                      )}
                    </div>
                    <p className={`font-semibold text-xs truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      {getItemLabel(item)}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {getItemPreview(item)}
                    </p>
                  </div>

                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      size="icon" variant="ghost"
                      className={`h-7 w-7 transition-smooth ${isCurrent ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={() => onSendItem(item)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive transition-smooth"
                      onClick={() => onRemoveFromQueue(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {history.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun élément projeté.
              </p>
            )}
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onResend(item)}
                className="w-full text-left p-3 bg-secondary/60 hover:bg-surface-hover rounded-lg border border-transparent hover:border-primary/15 transition-smooth"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-medium ${getItemTypeColor(item)}`}>
                    {getItemTypeLabel(item)}
                  </span>
                </div>
                <p className="text-primary font-semibold text-sm">{getItemLabel(item)}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{getItemPreview(item)}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
