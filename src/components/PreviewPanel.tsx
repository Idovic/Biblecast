/* Panneau de prévisualisation du verset / slide avant envoi */
import { Send, Plus, Trash2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VerseReference, CustomSlide } from '@/types/bible';
import { formatReference } from '@/lib/bible';

interface PreviewPanelProps {
  selectedVerse: VerseReference | null;
  selectedSlide: CustomSlide | null;
  onSendToDisplay: () => void;
  onAddToQueue: () => void;
  onClearDisplay: () => void;
}

export default function PreviewPanel({
  selectedVerse, selectedSlide, onSendToDisplay, onAddToQueue, onClearDisplay
}: PreviewPanelProps) {
  const hasContent = selectedVerse || selectedSlide;

  return (
    <div className="flex flex-col h-full">
      {/* Zone de prévisualisation */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!hasContent && (
          <div className="text-center text-muted-foreground">
            <Monitor className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium">Sélectionnez un verset ou une slide</p>
            <p className="text-sm mt-1 opacity-70">pour prévisualiser avant l'envoi</p>
          </div>
        )}

        {selectedVerse && (
          <div className="text-center max-w-xl animate-fade-in">
            <p className="text-2xl leading-relaxed font-serif text-foreground">
              « {selectedVerse.text} »
            </p>
            <p className="mt-5 text-primary font-bold text-lg tracking-wide">
              {formatReference(selectedVerse)}
            </p>
          </div>
        )}

        {selectedSlide && !selectedVerse && (
          <div className="text-center max-w-xl animate-fade-in">
            {selectedSlide.title && (
              <h3 className="text-3xl font-bold text-foreground mb-4">{selectedSlide.title}</h3>
            )}
            <p className="text-lg text-foreground/80 leading-relaxed">{selectedSlide.content}</p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          onClick={onSendToDisplay}
          disabled={!hasContent}
          className="w-full h-14 text-lg font-bold btn-gold rounded-xl gap-2 disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
          ENVOYER À L'ÉCRAN
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={onAddToQueue}
            disabled={!hasContent}
            variant="secondary"
            className="flex-1 h-12 gap-2 rounded-lg transition-smooth hover:border-primary/30 border border-transparent"
          >
            <Plus className="h-4 w-4" />
            Ajouter à la file
          </Button>
          <Button
            onClick={onClearDisplay}
            variant="secondary"
            className="h-12 gap-2 rounded-lg text-muted-foreground transition-smooth hover:border-destructive/30 border border-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Effacer
          </Button>
        </div>
      </div>
    </div>
  );
}
