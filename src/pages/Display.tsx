/* Page d'affichage — Mode TV / Projecteur */
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBroadcastReceiver, getLastDisplay, getLastTheme } from '@/hooks/useBroadcastChannel';
import { usePeerGuest } from '@/hooks/usePeerSync';
import type { VerseReference, CustomSlide, DisplayTheme, DisplayMessage, SlideType } from '@/types/bible';
import { formatReference } from '@/lib/bible';
import { loadSettings, type ChurchSettings } from '@/components/SettingsPanel';

const FONT_SIZE_MAP = {
  small: 'text-3xl',
  medium: 'text-4xl',
  large: 'text-5xl',
  xlarge: 'text-6xl',
};

const TITLE_SIZE_MAP = {
  small: 'text-2xl',
  medium: 'text-3xl',
  large: 'text-4xl',
  xlarge: 'text-5xl',
};

const REF_SIZE_MAP = {
  small: 'text-lg',
  medium: 'text-xl',
  large: 'text-2xl',
  xlarge: 'text-3xl',
};

const DEFAULT_THEME: DisplayTheme = {
  name: 'Noir classique',
  className: 'theme-noir-classique',
  fontSize: 'large',
  fontFamily: 'serif',
  bgOpacity: 1,
};

export default function Display() {
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');

  const [verse, setVerse] = useState<VerseReference | null>(null);
  const [slide, setSlide] = useState<CustomSlide | null>(null);
  const [theme, setTheme] = useState<DisplayTheme>(() => getLastTheme() ?? DEFAULT_THEME);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'empty' | 'verse' | 'slide'>('empty');
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);

  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(loadSettings());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /* Restaure le dernier contenu projeté sans animation (ouverture d'onglet) */
  const restoreImmediate = useCallback((msg: DisplayMessage) => {
    if (msg.type === 'show-verse' && msg.verse) {
      setVerse(msg.verse);
      setSlide(null);
      setMode('verse');
      setVisible(true);
    } else if (msg.type === 'show-slide' && msg.slide) {
      setSlide(msg.slide);
      setVerse(null);
      setMode('slide');
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const saved = getLastDisplay();
    if (saved) restoreImmediate(saved);
  }, [restoreImmediate]);

  const handleMessage = useCallback((msg: DisplayMessage) => {
    if (msg.type === 'show-verse' && msg.verse) {
      setVisible(false);
      setTimeout(() => {
        setVerse(msg.verse!);
        setSlide(null);
        setMode('verse');
        setVisible(true);
      }, 300);
    } else if (msg.type === 'show-slide' && msg.slide) {
      setVisible(false);
      setTimeout(() => {
        setSlide(msg.slide!);
        setVerse(null);
        setMode('slide');
        setVisible(true);
      }, 300);
    } else if (msg.type === 'clear') {
      setVisible(false);
      setTimeout(() => {
        setVerse(null);
        setSlide(null);
        setMode('empty');
      }, 500);
    } else if (msg.type === 'theme-change' && msg.theme) {
      setTheme(msg.theme);
    }
  }, []);

  useBroadcastReceiver(roomCode ? () => {} : handleMessage);
  const peerState = usePeerGuest(roomCode, handleMessage);

  const fontFamily = theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans';
  const fontSize = FONT_SIZE_MAP[theme.fontSize];
  const titleSize = TITLE_SIZE_MAP[theme.fontSize];
  const refSize = REF_SIZE_MAP[theme.fontSize];

  const slideStyle: React.CSSProperties = {};
  if (mode === 'slide' && slide) {
    if (slide.backgroundImage) {
      slideStyle.backgroundImage = `url(${slide.backgroundImage})`;
      slideStyle.backgroundSize = 'cover';
      slideStyle.backgroundPosition = 'center';
    } else if (slide.backgroundGradient) {
      slideStyle.background = slide.backgroundGradient;
    } else if (slide.backgroundColor) {
      slideStyle.backgroundColor = slide.backgroundColor;
    }
  }

  const verseStyle: React.CSSProperties = {};
  if (mode === 'verse' && theme.verseBackgroundImage) {
    verseStyle.backgroundImage = `url(${theme.verseBackgroundImage})`;
    verseStyle.backgroundSize = 'cover';
    verseStyle.backgroundPosition = 'center';
  }

  const showLogo = (mode === 'verse' && theme.showChurchLogo) || (mode === 'slide' && !!slide?.showLogo);
  const churchLogo = settings.churchLogo;

  const slideType: SlideType = slide?.slideType || 'text-title';
  const defaultFg = 'hsl(var(--display-fg))';
  const fg = (mode === 'slide' && slide?.textColor) ? slide.textColor : defaultFg;
  const fgDim = (mode === 'slide' && slide?.textColor)
    ? slide.textColor + 'cc'
    : 'hsl(var(--display-fg) / 0.75)';
  const textShadowStyle = (mode === 'slide' && slide?.textShadow)
    ? '0 2px 12px rgba(0,0,0,0.8), 0 4px 32px rgba(0,0,0,0.5)'
    : undefined;

  const transitionStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity ${settings.transitionSpeed}ms ease-out, transform ${settings.transitionSpeed}ms ease-out`,
  };

  return (
    <div
      className={`h-screen w-screen flex items-center justify-center ${theme.className} overflow-hidden cursor-none relative`}
      style={{
        backgroundColor: mode === 'slide' ? undefined : `hsl(var(--display-bg) / ${theme.bgOpacity})`,
        color: fg,
        ...(mode === 'slide' ? slideStyle : verseStyle),
      }}
    >
      {/* Overlay sombre pour lisibilité quand fond image verset */}
      {mode === 'verse' && theme.verseBackgroundImage && (
        <div className="absolute inset-0 bg-black/50 z-0" />
      )}

      {/* Logo d'église en overlay */}
      {showLogo && churchLogo && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <img src={churchLogo} alt="Logo" className="h-16 object-contain opacity-90 drop-shadow-lg" />
        </div>
      )}
      {/* Indicateur de connexion PeerJS (coin bas-droite) */}
      {roomCode && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderColor: peerState.isConnected ? 'rgba(74,222,128,0.4)' : 'rgba(251,191,36,0.4)',
            color: peerState.isConnected ? '#4ade80' : '#fbbf24',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: peerState.isConnected ? '#4ade80' : '#fbbf24',
              animation: 'pulse 2s infinite',
            }}
          />
          {peerState.isConnected ? 'Connecté' : 'Connexion...'}
        </div>
      )}

      {/* Écran vide */}
      {mode === 'empty' && (
        <div className="text-center animate-fade-in">
          {settings.churchLogo && (
            <img
              src={settings.churchLogo}
              alt="Logo"
              className="h-24 w-24 object-contain mx-auto mb-6 opacity-40"
            />
          )}
          <p
            className="text-3xl tracking-widest uppercase opacity-30"
            style={{ color: fg, fontFamily: settings.defaultFont }}
          >
            {settings.churchName || 'BibleCast'}
          </p>
        </div>
      )}

      {/* Verset */}
      {mode === 'verse' && verse && (
        <div className={`relative z-10 text-center max-w-5xl px-12 ${fontFamily}`} style={transitionStyle}>
          <p
            className={`${fontSize} ${
              settings.lineSpacing === 'tight' ? 'leading-snug' :
              settings.lineSpacing === 'relaxed' ? 'leading-loose' : 'leading-relaxed'
            }`}
            style={{
              color: fg,
              textShadow: settings.textShadowDefault ? '0 2px 12px rgba(0,0,0,0.8)' : undefined,
            }}
          >
            {settings.verseQuotes ? `« ${verse.text} »` : verse.text}
          </p>
          {settings.showVerseReference && (
            <p className={`mt-8 ${refSize} font-semibold tracking-wide`} style={{ color: fgDim }}>
              {formatReference(verse)}
            </p>
          )}
        </div>
      )}

      {/* Slide — rendu selon le type */}
      {mode === 'slide' && slide && (
        <div
          className={`text-center max-w-5xl px-12 ${fontFamily}`}
          style={{ ...transitionStyle, textShadow: textShadowStyle }}
        >

          {slideType === 'title-only' && (
            <h2 className={`${fontSize} font-bold leading-tight`} style={{ color: fg }}>
              {slide.title}
            </h2>
          )}

          {slideType === 'text-title' && (
            <>
              {slide.title && (
                <h2 className={`${titleSize} font-bold mb-6`} style={{ color: fg }}>
                  {slide.title}
                </h2>
              )}
              <p className={`${fontSize} leading-relaxed whitespace-pre-wrap`} style={{ color: fgDim }}>
                {slide.content}
              </p>
            </>
          )}

          {slideType === 'verse-title' && (
            <>
              {slide.title && (
                <h2 className={`${refSize} font-bold mb-8 tracking-wide uppercase`} style={{ color: fgDim }}>
                  {slide.title}
                </h2>
              )}
              <p className={`${fontSize} leading-relaxed font-serif`} style={{ color: fg }}>
                « {slide.content} »
              </p>
            </>
          )}

          {slideType === 'bullet-list' && (
            <>
              {slide.title && (
                <h2 className={`${titleSize} font-bold mb-10`} style={{ color: fg }}>
                  {slide.title}
                </h2>
              )}
              <ul className="text-left inline-block space-y-5">
                {(slide.bullets || []).filter(Boolean).map((b, i) => (
                  <li key={i} className={`flex items-start gap-4 ${fontSize}`} style={{ color: fgDim }}>
                    <span className="mt-1 opacity-70" style={{ color: fg }}>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {slideType === 'blank' && null}
        </div>
      )}
    </div>
  );
}
