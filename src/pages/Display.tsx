/* Page d'affichage — Mode TV / Projecteur */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBroadcastReceiver, useControlSender, getLastDisplay, getLastTheme } from '@/hooks/useBroadcastChannel';
import { usePeerGuest, useLocalWsGuest } from '@/hooks/usePeerSync';
import type { VerseReference, CustomSlide, DisplayTheme, DisplayMessage, SlideType } from '@/types/bible';
import { formatReference, loadBible, getVerse, getChapters, getVerses, BIBLE_BOOKS } from '@/lib/bible';
import { loadSettings, type ChurchSettings } from '@/components/SettingsPanel';
import { Maximize2, Minimize2 } from 'lucide-react';

const FONT_SIZE_MAP = {
  small:  { clamp: 'clamp(1rem, 2.5vw, 1.875rem)' },
  medium: { clamp: 'clamp(1.25rem, 3vw, 2.25rem)' },
  large:  { clamp: 'clamp(1.5rem, 4vw, 3rem)' },
  xlarge: { clamp: 'clamp(2rem, 5vw, 3.75rem)' },
};

const TITLE_SCALE: Record<string, string> = {
  small: 'clamp(0.875rem, 2vw, 1.5rem)',
  medium: 'clamp(1rem, 2.5vw, 1.875rem)',
  large: 'clamp(1.25rem, 3vw, 2.25rem)',
  xlarge: 'clamp(1.5rem, 4vw, 3rem)',
};

const REF_SCALE: Record<string, string> = {
  small: 'clamp(0.75rem, 1.5vw, 1.125rem)',
  medium: 'clamp(0.875rem, 1.8vw, 1.25rem)',
  large: 'clamp(1rem, 2vw, 1.5rem)',
  xlarge: 'clamp(1.125rem, 2.5vw, 1.875rem)',
};

const SLIDE_FONT_SIZE: Record<string, string> = {
  small:  'clamp(0.875rem, 2vw, 1.5rem)',
  medium: 'clamp(1.125rem, 2.5vw, 2rem)',
  large:  'clamp(1.5rem, 3.5vw, 2.75rem)',
  xlarge: 'clamp(1.875rem, 4.5vw, 3.5rem)',
};

const DEFAULT_THEME: DisplayTheme = {
  name: 'Noir classique',
  className: 'theme-noir-classique',
  fontSize: 'large',
  fontFamily: 'serif',
  bgOpacity: 1,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

async function getDailyVerse(): Promise<VerseReference | null> {
  try {
    const bible = await loadBible();
    const daySeed = Math.floor(Date.now() / 86400000);
    const books = Object.keys(bible);
    const bookName = books[Math.floor(seededRandom(daySeed) * books.length)];
    const chapters = getChapters(bible, bookName);
    if (!chapters.length) return null;
    const chapter = chapters[Math.floor(seededRandom(daySeed + 1) * chapters.length)];
    const verses = getVerses(bible, bookName, chapter);
    if (!verses.length) return null;
    const verseNum = verses[Math.floor(seededRandom(daySeed + 2) * verses.length)];
    return getVerse(bible, bookName, chapter, verseNum);
  } catch { return null; }
}

async function getManualVerse(ref: string): Promise<VerseReference | null> {
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/i);
  if (!match) return null;
  const bookQuery = match[1].trim().toLowerCase();
  const book = BIBLE_BOOKS.find(b =>
    b.toLowerCase() === bookQuery || b.toLowerCase().startsWith(bookQuery)
  );
  if (!book) return null;
  try {
    const bible = await loadBible();
    return getVerse(bible, book, parseInt(match[2]), parseInt(match[3]));
  } catch { return null; }
}

function formatClockTime(now: Date, showSeconds: boolean): string {
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  if (showSeconds) {
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

function formatClockDate(now: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function Display() {
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  const wsParam = searchParams.get('ws');

  const [verse, setVerse] = useState<VerseReference | null>(null);
  const [verse2, setVerse2] = useState<VerseReference | null>(null);
  const [slide, setSlide] = useState<CustomSlide | null>(null);
  const [theme, setTheme] = useState<DisplayTheme>(() => getLastTheme() ?? DEFAULT_THEME);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'empty' | 'verse' | 'dual-verse' | 'slide'>('empty');
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [verseOfDay, setVerseOfDay] = useState<VerseReference | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sendControl = useControlSender();

  useEffect(() => {
    const interval = setInterval(() => setSettings(loadSettings()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!settings.showClock) { setClockTime(''); setClockDate(''); return; }
    const update = () => {
      const now = new Date();
      setClockTime(formatClockTime(now, !!settings.showClockSeconds));
      if (settings.showClockDate) setClockDate(formatClockDate(now));
      else setClockDate('');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [settings.showClock, settings.showClockSeconds, settings.showClockDate]);

  useEffect(() => {
    if (!settings.showVerseOfDay) { setVerseOfDay(null); return; }
    if (settings.verseOfDayMode === 'manual' && settings.verseOfDayRef) {
      getManualVerse(settings.verseOfDayRef).then(setVerseOfDay);
    } else if (settings.verseOfDayMode === 'random') {
      getDailyVerse().then(setVerseOfDay);
    }
  }, [settings.showVerseOfDay, settings.verseOfDayMode, settings.verseOfDayRef]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    document.addEventListener('mousemove', resetControlsTimer);
    document.addEventListener('touchstart', resetControlsTimer);
    return () => {
      document.removeEventListener('mousemove', resetControlsTimer);
      document.removeEventListener('touchstart', resetControlsTimer);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const restoreImmediate = useCallback((msg: DisplayMessage) => {
    if (msg.type === 'show-verse' && msg.verse) {
      setVerse(msg.verse); setVerse2(null); setSlide(null); setMode('verse'); setVisible(true);
    } else if (msg.type === 'show-dual-verse' && msg.verse) {
      setVerse(msg.verse); setVerse2(msg.verse2 || null); setSlide(null); setMode('dual-verse'); setVisible(true);
    } else if (msg.type === 'show-slide' && msg.slide) {
      setSlide(msg.slide); setVerse(null); setVerse2(null); setMode('slide'); setVisible(true);
    }
  }, []);

  useEffect(() => {
    const saved = getLastDisplay();
    if (saved) restoreImmediate(saved);
    else { setMode('empty'); setVisible(true); }
  }, [restoreImmediate]);

  const handleMessage = useCallback((msg: DisplayMessage) => {
    if (msg.type === 'show-verse' && msg.verse) {
      setVisible(false);
      setTimeout(() => { setVerse(msg.verse!); setVerse2(null); setSlide(null); setMode('verse'); setVisible(true); }, 300);
    } else if (msg.type === 'show-dual-verse' && msg.verse) {
      setVisible(false);
      setTimeout(() => { setVerse(msg.verse!); setVerse2(msg.verse2 || null); setSlide(null); setMode('dual-verse'); setVisible(true); }, 300);
    } else if (msg.type === 'show-slide' && msg.slide) {
      setVisible(false);
      setTimeout(() => { setSlide(msg.slide!); setVerse(null); setVerse2(null); setMode('slide'); setVisible(true); }, 300);
    } else if (msg.type === 'clear') {
      setVisible(false);
      setTimeout(() => {
        setVerse(null); setVerse2(null); setSlide(null); setMode('empty');
        setTimeout(() => setVisible(true), 50);
      }, 400);
    } else if (msg.type === 'theme-change' && msg.theme) {
      setTheme(msg.theme);
    }
  }, []);

  useBroadcastReceiver(handleMessage);
  const peerState = usePeerGuest(roomCode, handleMessage);
  const localWsState = useLocalWsGuest(wsParam, handleMessage);

  useEffect(() => {
    const w = window as any;
    if (!w.cast?.framework?.CastReceiverContext) return;
    try {
      const context = w.cast.framework.CastReceiverContext.getInstance();
      const bus = context.getCastMessageBus('urn:x-cast:app.biblecast');
      bus.onMessage = (event: any) => {
        try { handleMessage(event.data as DisplayMessage); } catch { }
      };
      context.start();
    } catch { }
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      const msg: DisplayMessage = dx < 0 ? { type: 'request-next' } : { type: 'request-prev' };
      sendControl(msg);
      peerState.sendToHost(msg);
    };
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [sendControl, peerState]);

  const fontFamily = theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans';
  const fontSize = FONT_SIZE_MAP[theme.fontSize];

  const bgImageStyle: React.CSSProperties = {};
  if (mode === 'slide' && slide) {
    if (slide.backgroundImage) {
      bgImageStyle.backgroundImage = `url(${slide.backgroundImage})`;
      bgImageStyle.backgroundSize = 'cover'; bgImageStyle.backgroundPosition = 'center';
    } else if (slide.backgroundGradient) {
      bgImageStyle.background = slide.backgroundGradient;
    } else if (slide.backgroundColor) {
      bgImageStyle.backgroundColor = slide.backgroundColor;
    }
  } else if ((mode === 'verse' || mode === 'dual-verse') && theme.verseBackgroundImage) {
    bgImageStyle.backgroundImage = `url(${theme.verseBackgroundImage})`;
    bgImageStyle.backgroundSize = 'cover'; bgImageStyle.backgroundPosition = 'center';
  } else if (mode === 'empty') {
    if (theme.verseBackgroundImage) {
      bgImageStyle.backgroundImage = `url(${theme.verseBackgroundImage})`;
      bgImageStyle.backgroundSize = 'cover'; bgImageStyle.backgroundPosition = 'center';
    } else {
      bgImageStyle.background = 'linear-gradient(135deg, #1e1b4b 0%, #1c2f6b 40%, #0d1b2a 100%)';
    }
  }

  const hasBgImage = !!(bgImageStyle.backgroundImage);
  const showLogo = ((mode === 'verse' || mode === 'dual-verse') && theme.showChurchLogo) || (mode === 'slide' && !!slide?.showLogo);
  const slideType: SlideType = slide?.slideType || 'text-title';
  const defaultFg = 'hsl(var(--display-fg))';
  const fg = (mode === 'slide' && slide?.textColor) ? slide.textColor : defaultFg;
  const fgDim = (mode === 'slide' && slide?.textColor) ? slide.textColor + 'cc' : 'hsl(var(--display-fg) / 0.75)';
  const textShadowStyle = (mode === 'slide' && slide?.textShadow)
    ? '0 2px 12px rgba(0,0,0,0.8), 0 4px 32px rgba(0,0,0,0.5)' : undefined;

  const transitionStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity ${settings.transitionSpeed}ms ease-out, transform ${settings.transitionSpeed}ms ease-out`,
  };

  const baseTextShadow = settings.textShadowDefault ? '0 2px 12px rgba(0,0,0,0.8)' : undefined;
  const splitLayout = settings.splitLayout ?? 'horizontal';

  return (
    <div
      className={`h-screen w-screen overflow-hidden cursor-none relative flex items-center justify-center ${theme.className}`}
      style={{ backgroundColor: hasBgImage ? undefined : `hsl(var(--display-bg) / ${theme.bgOpacity})`, color: fg }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          ...bgImageStyle,
          backgroundColor: hasBgImage ? undefined :
            mode === 'empty' ? undefined :
            `hsl(var(--display-bg) / ${theme.bgOpacity})`,
          filter: settings.displayBgBlur && hasBgImage ? 'blur(8px) brightness(0.8) saturate(1.2)' : undefined,
          transform: settings.displayBgBlur && hasBgImage ? 'scale(1.08)' : undefined,
        }}
      />

      {(hasBgImage || mode === 'empty') && (
        <div className="absolute inset-0 z-[1] bg-black/35" />
      )}

      {showLogo && (theme.churchLogo || settings.churchLogo) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <img src={theme.churchLogo || settings.churchLogo} alt="Logo" className="h-16 object-contain opacity-90 drop-shadow-lg" />
        </div>
      )}

      {roomCode && peerState.status !== 'idle' && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderColor: peerState.status === 'connected'
              ? 'rgba(74,222,128,0.4)'
              : peerState.status === 'connecting'
              ? 'rgba(251,191,36,0.35)'
              : 'rgba(239,68,68,0.4)',
            color: peerState.status === 'connected' ? '#4ade80'
              : peerState.status === 'connecting' ? '#fbbf24'
              : '#f87171',
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{
            backgroundColor: peerState.status === 'connected' ? '#4ade80'
              : peerState.status === 'connecting' ? '#fbbf24' : '#f87171',
            animation: peerState.status === 'connected' ? 'none' : 'pulse 2s infinite',
          }} />
          {peerState.status === 'connected' ? 'Connecté'
            : peerState.status === 'connecting' ? 'Connexion en cours…'
            : 'Connexion perdue'}
          {peerState.status === 'error' && (
            <button onClick={peerState.forceReconnect} className="ml-1.5 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[10px] font-semibold">
              Réessayer
            </button>
          )}
        </div>
      )}

      {wsParam && localWsState.status !== 'idle' && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderColor: localWsState.status === 'connected'
              ? 'rgba(74,222,128,0.4)'
              : localWsState.status === 'connecting'
              ? 'rgba(251,191,36,0.35)'
              : 'rgba(239,68,68,0.4)',
            color: localWsState.status === 'connected' ? '#4ade80'
              : localWsState.status === 'connecting' ? '#fbbf24'
              : '#f87171',
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{
            backgroundColor: localWsState.status === 'connected' ? '#4ade80'
              : localWsState.status === 'connecting' ? '#fbbf24' : '#f87171',
            animation: localWsState.status === 'connected' ? 'none' : 'pulse 2s infinite',
          }} />
          {localWsState.status === 'connected' ? 'Local connecté'
            : localWsState.status === 'connecting' ? 'Connexion locale…'
            : 'Connexion locale perdue'}
        </div>
      )}

      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border border-white/20 text-white/60 hover:text-white/90 hover:bg-white/10 transition-all"
        style={{ opacity: showControls ? 1 : 0, transition: 'opacity 400ms ease', backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        {isFullscreen ? 'Quitter' : 'Plein écran'}
      </button>

      {/* État vide — écran de veille */}
      {mode === 'empty' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-between py-16 px-8" style={transitionStyle}>

          <div className="text-center">
            {settings.churchLogo && (
              <img src={settings.churchLogo} alt="Logo"
                className="h-20 w-20 object-contain mx-auto mb-3 opacity-75 drop-shadow-lg" />
            )}
            {settings.churchName && (
              <p className="text-xl tracking-widest uppercase opacity-50"
                style={{ color: fg, fontFamily: settings.defaultFont, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                {settings.churchName}
              </p>
            )}
          </div>

          {settings.showVerseOfDay && verseOfDay && (
            <div className="text-center w-full max-w-[85vw] px-8 space-y-5">
              <p className="text-xs uppercase tracking-[0.3em] font-medium opacity-60" style={{ color: fg }}>
                — Verset du jour —
              </p>
              <p className="leading-relaxed opacity-90 font-serif"
                style={{
                  color: fg,
                  fontSize: 'clamp(1.1rem, 2.5vw, 2rem)',
                  textShadow: '0 2px 24px rgba(0,0,0,0.7)',
                }}>
                « {verseOfDay.text} »
              </p>
              <p className="opacity-65 font-semibold tracking-widest uppercase"
                style={{ color: fg, fontSize: 'clamp(0.8rem, 1.5vw, 1.125rem)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                {formatReference(verseOfDay)}
              </p>
            </div>
          )}

          <div className="text-center space-y-2">
            {settings.showClock && clockTime && (
              <p className="font-bold tabular-nums tracking-tight opacity-80"
                style={{
                  color: fg,
                  fontSize: 'clamp(3rem, 10vw, 7rem)',
                  textShadow: '0 4px 40px rgba(0,0,0,0.6)',
                  fontFamily: 'monospace',
                }}>
                {clockTime}
              </p>
            )}
            {settings.showClock && settings.showClockDate && clockDate && (
              <p className="opacity-60 tracking-wider"
                style={{
                  color: fg,
                  fontSize: 'clamp(0.875rem, 2vw, 1.5rem)',
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>
                {clockDate}
              </p>
            )}
            <p className="text-[10px] opacity-[0.06]" style={{ color: fg }}>
              Développé avec ❤️ par le Frère Malachie
            </p>
          </div>

        </div>
      )}

      {/* Verset simple */}
      {mode === 'verse' && verse && (
        <div className={`relative z-10 text-center w-full max-w-[88vw] px-12 ${fontFamily}`} style={transitionStyle}>
          <p
            style={{
              fontSize: fontSize.clamp,
              lineHeight: settings.lineSpacing === 'tight' ? 1.3 : settings.lineSpacing === 'relaxed' ? 1.9 : 1.6,
              color: fg,
              textShadow: baseTextShadow,
            }}
          >
            {settings.verseQuotes ? `« ${verse.text} »` : verse.text}
          </p>
          {settings.showVerseReference && (
            <p className="mt-8 font-semibold tracking-wide" style={{ fontSize: REF_SCALE[theme.fontSize], color: fgDim }}>
              {formatReference(verse)}
            </p>
          )}
        </div>
      )}

      {/* Double verset — split-screen */}
      {mode === 'dual-verse' && verse && (
        <div
          className={`relative z-10 w-full max-w-[92vw] h-full flex items-center ${splitLayout === 'vertical' ? 'flex-row gap-0' : 'flex-col gap-0'}`}
          style={transitionStyle}
        >
          {/* Panneau 1 — version principale */}
          <div
            className={`flex flex-col items-center justify-center text-center px-10 py-10 ${fontFamily} ${splitLayout === 'vertical' ? 'flex-1 border-r border-white/15' : 'flex-1 border-b border-white/15'}`}
          >
            <p
              style={{
                fontSize: `clamp(1rem, ${splitLayout === 'vertical' ? '2.5vw' : '3.5vw'}, 2.25rem)`,
                lineHeight: settings.lineSpacing === 'tight' ? 1.3 : settings.lineSpacing === 'relaxed' ? 1.9 : 1.6,
                color: fg,
                textShadow: baseTextShadow,
              }}
            >
              {settings.verseQuotes ? `« ${verse.text} »` : verse.text}
            </p>
            {settings.showVerseReference && (
              <p className="mt-5 font-semibold tracking-wide opacity-75"
                style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.125rem)', color: fg }}>
                {formatReference(verse)} — {settings.bibleVersion || 'LSG'}
              </p>
            )}
          </div>

          {/* Panneau 2 — version secondaire */}
          {verse2 && (
            <div
              className={`flex flex-col items-center justify-center text-center px-10 py-10 ${fontFamily} flex-1`}
            >
              <p
                style={{
                  fontSize: `clamp(1rem, ${splitLayout === 'vertical' ? '2.5vw' : '3.5vw'}, 2.25rem)`,
                  lineHeight: settings.lineSpacing === 'tight' ? 1.3 : settings.lineSpacing === 'relaxed' ? 1.9 : 1.6,
                  color: fg,
                  opacity: 0.88,
                  textShadow: baseTextShadow,
                }}
              >
                {settings.verseQuotes ? `« ${verse2.text} »` : verse2.text}
              </p>
              {settings.showVerseReference && (
                <p className="mt-5 font-semibold tracking-wide opacity-75"
                  style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.125rem)', color: fg }}>
                  {formatReference(verse2)} — {settings.bible2Version || 'BDS'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide */}
      {mode === 'slide' && slide && (
        <div
          className={`relative z-10 w-full max-w-[92vw] px-12 ${fontFamily}`}
          style={{
            ...transitionStyle,
            textShadow: textShadowStyle,
            textAlign: slide.textAlign ?? 'center',
          }}
        >
          {slideType === 'image-full' && (
            <div />
          )}

          {slideType === 'title-only' && (
            <h2 style={{ fontSize: SLIDE_FONT_SIZE[slide.fontSize ?? theme.fontSize], fontWeight: 700, lineHeight: 1.2, color: fg }}>
              {slide.title}
            </h2>
          )}

          {slideType === 'text-title' && (
            <>
              {slide.title && (
                <h2 className="font-bold mb-6" style={{ fontSize: TITLE_SCALE[slide.titleFontSize ?? slide.fontSize ?? theme.fontSize], color: fg }}>{slide.title}</h2>
              )}
              <p className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: SLIDE_FONT_SIZE[slide.fontSize ?? theme.fontSize], color: fgDim }}>{slide.content}</p>
            </>
          )}

          {slideType === 'verse-title' && (
            <>
              {slide.title && (
                <h2 className="font-bold mb-8 tracking-wide uppercase" style={{ fontSize: REF_SCALE[slide.titleFontSize ?? slide.fontSize ?? theme.fontSize], color: fgDim }}>{slide.title}</h2>
              )}
              <p className="leading-relaxed font-serif" style={{ fontSize: SLIDE_FONT_SIZE[slide.fontSize ?? theme.fontSize], color: fg }}>« {slide.content} »</p>
            </>
          )}

          {slideType === 'bullet-list' && (
            <>
              {slide.title && (
                <h2 className="font-bold mb-10" style={{ fontSize: TITLE_SCALE[slide.titleFontSize ?? slide.fontSize ?? theme.fontSize], color: fg }}>{slide.title}</h2>
              )}
              <ul className={slide.textAlign === 'left' ? 'inline-block space-y-5' : slide.textAlign === 'right' ? 'inline-block space-y-5 text-right' : 'inline-block space-y-5'}>
                {(slide.bullets || []).filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-4" style={{ fontSize: SLIDE_FONT_SIZE[slide.fontSize ?? theme.fontSize], color: fgDim }}>
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
