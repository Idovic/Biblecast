/* Page d'affichage — Mode TV / Projecteur */
import { useState, useCallback, useEffect } from 'react';
import { useBroadcastReceiver } from '@/hooks/useBroadcastChannel';
import type { VerseReference, CustomSlide, DisplayTheme, DisplayMessage } from '@/types/bible';
import { formatReference } from '@/lib/bible';
import { loadSettings, type ChurchSettings } from '@/components/SettingsPanel';

const FONT_SIZE_MAP = {
  small: 'text-3xl',
  medium: 'text-4xl',
  large: 'text-5xl',
  xlarge: 'text-6xl',
};

const REF_SIZE_MAP = {
  small: 'text-lg',
  medium: 'text-xl',
  large: 'text-2xl',
  xlarge: 'text-3xl',
};

export default function Display() {
  const [verse, setVerse] = useState<VerseReference | null>(null);
  const [slide, setSlide] = useState<CustomSlide | null>(null);
  const [theme, setTheme] = useState<DisplayTheme>({
    name: 'Noir classique',
    className: 'theme-noir-classique',
    fontSize: 'large',
    fontFamily: 'serif',
    bgOpacity: 1,
  });
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'empty' | 'verse' | 'slide'>('empty');
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);

  // Relire les paramètres périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(loadSettings());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  useBroadcastReceiver(handleMessage);

  const fontFamily = theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans';
  const fontSize = FONT_SIZE_MAP[theme.fontSize];
  const refSize = REF_SIZE_MAP[theme.fontSize];

  const slideStyle: React.CSSProperties = {};
  if (mode === 'slide' && slide) {
    if (slide.backgroundImage) {
      slideStyle.backgroundImage = `url(${slide.backgroundImage})`;
      slideStyle.backgroundSize = 'cover';
      slideStyle.backgroundPosition = 'center';
    } else if (slide.backgroundColor) {
      slideStyle.backgroundColor = slide.backgroundColor;
    }
  }

  return (
    <div
      className={`h-screen w-screen flex items-center justify-center ${theme.className} overflow-hidden cursor-none`}
      style={{
        backgroundColor: mode === 'slide' ? undefined : `hsl(var(--display-bg) / ${theme.bgOpacity})`,
        color: 'hsl(var(--display-fg))',
        ...slideStyle,
      }}
    >
      {/* Écran vide — nom de l'église + logo */}
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
            style={{ color: 'hsl(var(--display-fg))', fontFamily: settings.defaultFont }}
          >
            {settings.churchName || 'BibleCast'}
          </p>
        </div>
      )}

      {/* Affichage du verset */}
      {mode === 'verse' && verse && (
        <div
          className={`text-center max-w-5xl px-12 ${fontFamily}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity ${settings.transitionSpeed}ms ease-out, transform ${settings.transitionSpeed}ms ease-out`,
          }}
        >
          <p className={`${fontSize} leading-relaxed`} style={{ color: 'hsl(var(--display-fg))' }}>
            « {verse.text} »
          </p>
          <p
            className={`mt-8 ${refSize} font-semibold tracking-wide`}
            style={{ color: 'hsl(var(--display-fg) / 0.7)' }}
          >
            {formatReference(verse)}
          </p>
        </div>
      )}

      {/* Affichage de la slide */}
      {mode === 'slide' && slide && (
        <div
          className={`text-center max-w-5xl px-12 ${fontFamily}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity ${settings.transitionSpeed}ms ease-out, transform ${settings.transitionSpeed}ms ease-out`,
          }}
        >
          {slide.title && (
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'hsl(var(--display-fg))' }}>
              {slide.title}
            </h2>
          )}
          <p className={`${fontSize} leading-relaxed whitespace-pre-wrap`} style={{ color: 'hsl(var(--display-fg))' }}>
            {slide.content}
          </p>
        </div>
      )}
    </div>
  );
}
