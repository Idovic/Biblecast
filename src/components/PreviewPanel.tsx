/* Panneau de prévisualisation du verset / slide avant envoi */
import { Send, Plus, Trash2, Monitor, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VerseReference, CustomSlide, SlideType, DisplayTheme } from '@/types/bible';
import { formatReference } from '@/lib/bible';

interface PreviewPanelProps {
  selectedVerse: VerseReference | null;
  selectedSlide: CustomSlide | null;
  onSendToDisplay: () => void;
  onAddToQueue: () => void;
  onClearDisplay: () => void;
  theme: DisplayTheme;
  onThemeChange: (theme: DisplayTheme) => void;
}

function SlidePreview({ slide }: { slide: CustomSlide }) {
  const type: SlideType = slide.slideType || 'text-title';
  const textColor = slide.textColor || '#ffffff';

  const containerStyle: React.CSSProperties = {};
  if (slide.backgroundImage) {
    containerStyle.backgroundImage = `url(${slide.backgroundImage})`;
    containerStyle.backgroundSize = 'cover';
    containerStyle.backgroundPosition = 'center';
  } else if (slide.backgroundGradient) {
    containerStyle.background = slide.backgroundGradient;
  } else if (slide.backgroundColor) {
    containerStyle.backgroundColor = slide.backgroundColor;
  } else {
    containerStyle.backgroundColor = '#1a1a2e';
  }

  const textStyle: React.CSSProperties = {
    color: textColor,
    textShadow: slide.textShadow ? '0 1px 6px rgba(0,0,0,0.8)' : undefined,
  };

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border/40 flex items-center justify-center p-6 min-h-[160px] relative"
      style={containerStyle}
    >
      {/* Overlay pour lisibilité */}
      {(slide.backgroundImage || (slide.backgroundColor && slide.backgroundColor !== '#000000')) && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      <div className="relative z-10 text-center w-full animate-fade-in">
        {type === 'blank' && (
          <span className="text-xs italic" style={{ color: textColor + '66' }}>Slide vide</span>
        )}

        {type === 'title-only' && (
          <h3 className="text-2xl font-bold leading-tight" style={textStyle}>{slide.title}</h3>
        )}

        {(type === 'text-title' || type === 'verse-title') && (
          <>
            {slide.title && <h3 className="text-lg font-bold mb-3" style={textStyle}>{slide.title}</h3>}
            {slide.content && (
              <p className={`text-sm leading-relaxed ${type === 'verse-title' ? 'italic' : ''}`} style={{ ...textStyle, opacity: 0.85 }}>
                {type === 'verse-title' ? `« ${slide.content} »` : slide.content}
              </p>
            )}
          </>
        )}

        {type === 'bullet-list' && (
          <>
            {slide.title && <h3 className="text-lg font-bold mb-3" style={textStyle}>{slide.title}</h3>}
            <ul className="text-left inline-block space-y-1.5">
              {(slide.bullets || []).filter(Boolean).slice(0, 5).map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ ...textStyle, opacity: 0.85 }}>
                  <span className="shrink-0" style={{ color: textColor }}>•</span>
                  <span>{b}</span>
                </li>
              ))}
              {(slide.bullets || []).filter(Boolean).length > 5 && (
                <li className="text-xs mt-1" style={{ color: textColor + '66' }}>
                  +{(slide.bullets || []).filter(Boolean).length - 5} de plus…
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function PreviewPanel({
  selectedVerse, selectedSlide, onSendToDisplay, onAddToQueue, onClearDisplay, theme, onThemeChange
}: PreviewPanelProps) {
  const hasContent = selectedVerse || selectedSlide;

  const verseContainerStyle: React.CSSProperties = theme.verseBackgroundImage
    ? {
        backgroundImage: `url(${theme.verseBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: '#0a0a12' };

  return (
    <div className="flex flex-col h-full">
      {/* Zone de prévisualisation */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {!hasContent && (
          <div className="text-center text-muted-foreground">
            <Monitor className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">Sélectionnez un verset ou une slide</p>
            <p className="text-sm mt-1 opacity-60">pour prévisualiser avant l'envoi</p>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs opacity-40">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Appuyez sur <kbd className="px-1 py-0.5 rounded border border-border/60 font-mono bg-secondary text-foreground/80 text-[10px]">?</kbd> pour les raccourcis</span>
            </div>
          </div>
        )}

        {selectedVerse && (
          <div className="text-center max-w-xl w-full animate-fade-in">
            <div
              className="rounded-xl border border-border/30 p-8 mb-4 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden"
              style={verseContainerStyle}
            >
              {theme.verseBackgroundImage && <div className="absolute inset-0 bg-black/40" />}
              <p className={`relative z-10 text-xl leading-relaxed text-white ${theme.fontFamily === 'serif' ? 'font-serif' : ''}`}>
                « {selectedVerse.text} »
              </p>
              <p className="relative z-10 mt-4 text-[#f4a261] font-bold text-base tracking-wide">
                {formatReference(selectedVerse)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Double-clic sur un verset pour projeter directement
            </p>
          </div>
        )}

        {selectedSlide && !selectedVerse && (
          <div className="w-full max-w-xl animate-fade-in">
            <SlidePreview slide={selectedSlide} />
          </div>
        )}
      </div>

      {/* Barre thème compacte */}
      <div className="px-4 py-2 border-t border-border/40 bg-secondary/20 flex items-center gap-3 shrink-0 flex-wrap">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Versets</span>
        <div className="flex gap-1">
          {(['small','medium','large','xlarge'] as const).map(sz => (
            <button
              key={sz}
              onClick={() => onThemeChange({ ...theme, fontSize: sz })}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                theme.fontSize === sz
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
              }`}
            >
              {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : sz === 'large' ? 'L' : 'XL'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['serif','sans-serif'] as const).map(ff => (
            <button
              key={ff}
              onClick={() => onThemeChange({ ...theme, fontFamily: ff })}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                theme.fontFamily === ff
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
              }`}
            >
              {ff === 'serif' ? 'Serif' : 'Sans'}
            </button>
          ))}
        </div>
        {theme.verseBackgroundImage && (
          <span className="ml-auto text-[10px] text-amber-400/80 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400/80" />
            Fond actif
          </span>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="p-4 border-t border-border space-y-2.5 shrink-0">
        <Button
          onClick={onSendToDisplay}
          disabled={!hasContent}
          className="w-full h-12 text-base font-bold btn-gold rounded-xl gap-2 disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
          PROJETER
          <span className="ml-1 text-xs font-normal opacity-70">(Entrée)</span>
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={onAddToQueue}
            disabled={!hasContent}
            variant="secondary"
            className="flex-1 h-10 gap-2 rounded-lg transition-smooth hover:border-primary/30 border border-transparent"
          >
            <Plus className="h-4 w-4" />
            Ajouter à la timeline
          </Button>
          <Button
            onClick={onClearDisplay}
            variant="secondary"
            className="h-10 gap-2 px-3 rounded-lg text-muted-foreground transition-smooth hover:border-destructive/30 border border-transparent"
            title="Effacer l'écran (Échap)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
