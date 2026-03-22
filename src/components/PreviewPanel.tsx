/* Panneau de prévisualisation — verset/slide + barre thème claire */
import { Send, Plus, Trash2, Monitor, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VerseReference, CustomSlide, SlideType, DisplayTheme } from '@/types/bible';
import { formatReference } from '@/lib/bible';

const FONT_SIZE_PREVIEW: Record<string, string> = {
  small: 'text-base',
  medium: 'text-xl',
  large: 'text-2xl',
  xlarge: 'text-3xl',
};

const TITLE_SIZE_PREVIEW: Record<string, string> = {
  small: 'text-sm',
  medium: 'text-lg',
  large: 'text-xl',
  xlarge: 'text-2xl',
};

interface PreviewPanelProps {
  selectedVerse: VerseReference | null;
  selectedSlide: CustomSlide | null;
  onSendToDisplay: () => void;
  onAddToQueue: () => void;
  onClearDisplay: () => void;
  theme: DisplayTheme;
  onThemeChange: (theme: DisplayTheme) => void;
  churchLogo?: string;
}

function SlidePreview({ slide, churchLogo }: { slide: CustomSlide; churchLogo?: string }) {
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
    textShadow: slide.textShadow ? '0 2px 8px rgba(0,0,0,0.9)' : undefined,
    textAlign: slide.textAlign ?? 'center',
  };

  const fontSize = FONT_SIZE_PREVIEW[slide.fontSize ?? 'large'];
  const titleSize = TITLE_SIZE_PREVIEW[slide.titleFontSize ?? slide.fontSize ?? 'large'];

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border/40 flex items-center justify-center min-h-[200px] relative"
      style={containerStyle}
    >
      {/* Overlay lisibilité */}
      {slide.backgroundImage && <div className="absolute inset-0 bg-black/30" />}

      {/* Logo église */}
      {slide.showLogo && churchLogo && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <img src={churchLogo} alt="Logo" className="h-10 object-contain drop-shadow-lg" />
        </div>
      )}

      {/* Contenu */}
      <div className="relative z-10 w-full px-6 py-8 animate-fade-in" style={{ textAlign: slide.textAlign ?? 'center' }}>

        {type === 'blank' && (
          <span className="text-xs italic" style={{ color: textColor + '66' }}>Slide vide</span>
        )}

        {type === 'image-full' && (
          <div className="flex flex-col items-center gap-2 opacity-60">
            <ImageIcon className="h-8 w-8" style={{ color: textColor }} />
            <p className="text-xs" style={{ color: textColor }}>Visuel / Image</p>
          </div>
        )}

        {type === 'title-only' && (
          <h3 className={`${titleSize} font-bold leading-tight`} style={textStyle}>
            {slide.title || <span className="opacity-30 italic text-sm">Titre…</span>}
          </h3>
        )}

        {(type === 'text-title') && (
          <div className={slide.showLogo && churchLogo ? 'mt-10' : ''}>
            {slide.title && (
              <h3 className={`${titleSize} font-bold mb-3 leading-tight`} style={textStyle}>{slide.title}</h3>
            )}
            {slide.content ? (
              <p className={`${fontSize} leading-relaxed whitespace-pre-wrap`}
                style={{ ...textStyle, opacity: 0.9 }}>
                {slide.content}
              </p>
            ) : (
              <p className="text-sm opacity-30 italic" style={{ color: textColor }}>Contenu…</p>
            )}
          </div>
        )}

        {type === 'verse-title' && (
          <div className={slide.showLogo && churchLogo ? 'mt-10' : ''}>
            {slide.title && (
              <p className="text-xs font-semibold tracking-widest uppercase opacity-60 mb-4" style={textStyle}>{slide.title}</p>
            )}
            {slide.content ? (
              <p className={`${fontSize} leading-relaxed font-serif italic`}
                style={{ ...textStyle }}>
                « {slide.content} »
              </p>
            ) : (
              <p className="text-sm opacity-30 italic" style={{ color: textColor }}>Verset…</p>
            )}
          </div>
        )}

        {type === 'bullet-list' && (
          <div className={slide.showLogo && churchLogo ? 'mt-10' : ''}>
            {slide.title && (
              <h3 className={`${titleSize} font-bold mb-4 leading-tight`} style={textStyle}>{slide.title}</h3>
            )}
            {(slide.bullets || []).filter(Boolean).length > 0 ? (
              <ul className="inline-block space-y-2 text-left">
                {(slide.bullets || []).filter(Boolean).slice(0, 6).map((b, i) => (
                  <li key={i} className={`flex items-start gap-2.5 ${fontSize}`}
                    style={{ ...textStyle, opacity: 0.9 }}>
                    <span style={{ color: textColor }} className="shrink-0 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
                {(slide.bullets || []).filter(Boolean).length > 6 && (
                  <li className="text-xs mt-1" style={{ color: textColor + '66' }}>
                    +{(slide.bullets || []).filter(Boolean).length - 6} de plus…
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm opacity-30 italic" style={{ color: textColor }}>Liste vide…</p>
            )}
          </div>
        )}
      </div>

      {/* Badge type */}
      <div className="absolute top-2 right-2 z-20 text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-white/60">
        {type.replace('-', ' ')}
      </div>
    </div>
  );
}

export default function PreviewPanel({
  selectedVerse, selectedSlide, onSendToDisplay, onAddToQueue, onClearDisplay, theme, onThemeChange, churchLogo,
}: PreviewPanelProps) {
  const hasContent = selectedVerse || selectedSlide;

  const verseContainerStyle: React.CSSProperties = theme.verseBackgroundImage
    ? {
        backgroundImage: `url(${theme.verseBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: '#0a0a12' };

  const verseFontSize = FONT_SIZE_PREVIEW[theme.fontSize] ?? 'text-xl';
  const verseFontFamily = theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div className="flex flex-col h-full">
      {/* Zone de prévisualisation */}
      <div className="flex-1 flex items-center justify-center p-5 overflow-hidden">
        {!hasContent && (
          <div className="text-center text-muted-foreground">
            <Monitor className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">Sélectionnez un verset ou une slide</p>
            <p className="text-sm mt-1 opacity-60">pour prévisualiser avant l'envoi</p>
          </div>
        )}

        {selectedVerse && (
          <div className="text-center max-w-xl w-full animate-fade-in">
            <div
              className="rounded-xl border border-border/30 px-8 py-8 mb-3 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden"
              style={verseContainerStyle}
            >
              {theme.verseBackgroundImage && <div className="absolute inset-0 bg-black/40" />}
              {theme.showChurchLogo && churchLogo && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                  <img src={churchLogo} alt="Logo" className="h-10 object-contain drop-shadow-lg" />
                </div>
              )}
              <p className={`relative z-10 ${verseFontSize} ${verseFontFamily} leading-relaxed text-white ${theme.showChurchLogo && churchLogo ? 'mt-12' : ''}`}>
                « {selectedVerse.text} »
              </p>
              <p className="relative z-10 mt-4 text-[#f4a261] font-bold text-base tracking-wide">
                {formatReference(selectedVerse)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Double-tap sur un verset pour projeter directement
            </p>
          </div>
        )}

        {selectedSlide && !selectedVerse && (
          <div className="w-full max-w-xl animate-fade-in">
            <SlidePreview slide={selectedSlide} churchLogo={churchLogo} />
          </div>
        )}
      </div>

      {/* Barre thème versets — claire et positionnée */}
      <div className="px-4 py-2.5 border-t border-border/40 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
            Taille sur TV :
          </span>
          <div className="flex gap-1">
            {(['small','medium','large','xlarge'] as const).map(sz => (
              <button
                key={sz}
                onClick={() => onThemeChange({ ...theme, fontSize: sz })}
                className={`h-7 px-2 text-[11px] font-semibold rounded-lg transition-all ${
                  theme.fontSize === sz
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
                title={sz === 'small' ? 'Petit' : sz === 'medium' ? 'Moyen' : sz === 'large' ? 'Grand' : 'Très grand'}
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
                className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${
                  theme.fontFamily === ff
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {ff === 'serif' ? 'Serif' : 'Sans'}
              </button>
            ))}
          </div>

          {/* Toggle logo versets */}
          {churchLogo && (
            <button
              onClick={() => onThemeChange({ ...theme, showChurchLogo: !theme.showChurchLogo })}
              title={theme.showChurchLogo ? 'Masquer le logo sur les versets' : 'Afficher le logo sur les versets'}
              className={`ml-auto h-7 px-2 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-all ${
                theme.showChurchLogo
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              Logo
            </button>
          )}

          {theme.verseBackgroundImage && !churchLogo && (
            <span className="ml-auto text-[10px] text-amber-400/80 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400/80" />
              Fond actif
            </span>
          )}
        </div>
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
