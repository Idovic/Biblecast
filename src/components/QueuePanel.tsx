/* File d'attente et historique des versets */
import { X, Send, Clock, ListOrdered, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { QueueItem } from '@/types/bible';
import { formatReference } from '@/lib/bible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QueuePanelProps {
  queue: QueueItem[];
  history: QueueItem[];
  onSendItem: (item: QueueItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onResend: (item: QueueItem) => void;
}

function getItemLabel(item: QueueItem): string {
  if (item.type === 'verse' && item.verse) return formatReference(item.verse);
  if (item.type === 'slide' && item.slide) return item.slide.title || 'Slide';
  return '—';
}

function getItemPreview(item: QueueItem): string {
  if (item.type === 'verse' && item.verse) return item.verse.text;
  if (item.type === 'slide' && item.slide) return item.slide.content;
  return '';
}

export default function QueuePanel({
  queue, history, onSendItem, onRemoveFromQueue, onMoveUp, onMoveDown, onResend
}: QueuePanelProps) {
  return (
    <Tabs defaultValue="queue" className="flex flex-col h-full">
      <TabsList className="mx-3 mt-3 bg-secondary/80 backdrop-blur-sm">
        <TabsTrigger value="queue" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <ListOrdered className="h-4 w-4" /> File ({queue.length})
        </TabsTrigger>
        <TabsTrigger value="history" className="flex-1 gap-1.5 transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
          <Clock className="h-4 w-4" /> Historique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="flex-1 mt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {queue.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                File d'attente vide. Sélectionnez des versets ou slides.
              </p>
            )}
            {queue.map((item, i) => (
              <div key={item.id} className="flex items-start gap-2 p-3 bg-secondary/60 rounded-lg border border-transparent hover:border-primary/15 transition-smooth group">
                <div className="flex flex-col gap-1">
                  <button onClick={() => onMoveUp(item.id)} disabled={i === 0}
                    className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-smooth">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => onMoveDown(item.id)} disabled={i === queue.length - 1}
                    className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-smooth">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-semibold text-sm">{getItemLabel(item)}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{getItemPreview(item)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 transition-smooth"
                    onClick={() => onSendItem(item)}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                    onClick={() => onRemoveFromQueue(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {history.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun verset projeté pour l'instant.
              </p>
            )}
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onResend(item)}
                className="w-full text-left p-3 bg-secondary/60 hover:bg-surface-hover rounded-lg border border-transparent hover:border-primary/15 transition-smooth"
              >
                <p className="text-primary font-semibold text-sm">{getItemLabel(item)}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{getItemPreview(item)}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
