import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Image, Layers, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadSettings } from '@/components/SettingsPanel';
import type { CustomSlide, DisplayTheme } from '@/types/bible';

interface GalleryImage {
  id: string;
  label: string;
  url: string;
}

interface GalleryPanelProps {
  selectedSlide: CustomSlide | null;
  theme: DisplayTheme;
  onApplyToSlide: (imageUrl: string) => void;
  onSetVerseBackground: (imageUrl: string | undefined) => void;
  onSetLogo: (show: boolean) => void;
  onThemeChange: (theme: DisplayTheme) => void;
}

const GALLERY_STORAGE_KEY = 'biblecast:gallery';

function useGallery() {
  const [userImages, setUserImages] = useState<GalleryImage[]>(() => {
    try { return JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const save = (imgs: GalleryImage[]) => {
    setUserImages(imgs);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(imgs));
  };

  const addImage = (label: string, dataUrl: string) => {
    const newImg: GalleryImage = { id: `user-${Date.now()}`, label, url: dataUrl };
    save([...userImages, newImg]);
  };

  const removeImage = (id: string) => save(userImages.filter(i => i.id !== id));

  return { userImages, addImage, removeImage };
}

function ImageCard({
  image,
  isActiveVerse,
  canDelete,
  onApplySlide,
  onApplyVerse,
  onDelete,
}: {
  image: GalleryImage;
  isActiveVerse: boolean;
  canDelete?: boolean;
  onApplySlide: () => void;
  onApplyVerse: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        isActiveVerse ? 'border-amber-400' : 'border-transparent hover:border-border/60'
      }`}
      style={{ aspectRatio: '16/9' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={image.url}
        alt={image.label}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {isActiveVerse && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="h-4 w-4 text-amber-400 drop-shadow" />
        </div>
      )}
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 p-1">
          <p className="text-white text-[10px] font-medium truncate w-full text-center px-1">{image.label}</p>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onApplySlide(); }}
              className="bg-white/20 hover:bg-white/40 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
            >
              <Layers className="h-3 w-3" /> Slide
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onApplyVerse(); }}
              className="bg-amber-500/80 hover:bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
            >
              <Image className="h-3 w-3" /> Versets
            </button>
          </div>
          {canDelete && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded p-0.5 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function GalleryPanel({
  selectedSlide,
  theme,
  onApplyToSlide,
  onSetVerseBackground,
  onSetLogo,
  onThemeChange,
}: GalleryPanelProps) {
  const [presetImages, setPresetImages] = useState<GalleryImage[]>([]);
  const { userImages, addImage, removeImage } = useGallery();
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = loadSettings();

  useEffect(() => {
    fetch('/backgrounds/index.json')
      .then(r => r.json())
      .then(setPresetImages)
      .catch(() => setPresetImages([]));
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      addImage(file.name.replace(/\.[^.]+$/, ''), dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeVerseUrl = theme.verseBackgroundImage;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5">

      {/* Section fonds prédéfinis */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Fonds prédéfinis
        </h3>
        {presetImages.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">Chargement…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {presetImages.map(img => (
              <ImageCard
                key={img.id}
                image={img}
                isActiveVerse={activeVerseUrl === img.url}
                onApplySlide={() => onApplyToSlide(img.url)}
                onApplyVerse={() =>
                  activeVerseUrl === img.url
                    ? onSetVerseBackground(undefined)
                    : onSetVerseBackground(img.url)
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Section mes fonds */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Mes fonds
          </h3>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Ajouter
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        {userImages.length === 0 ? (
          <div
            className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground/60">Cliquez pour ajouter une image</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {userImages.map(img => (
              <ImageCard
                key={img.id}
                image={img}
                isActiveVerse={activeVerseUrl === img.url}
                canDelete
                onApplySlide={() => onApplyToSlide(img.url)}
                onApplyVerse={() =>
                  activeVerseUrl === img.url
                    ? onSetVerseBackground(undefined)
                    : onSetVerseBackground(img.url)
                }
                onDelete={() => {
                  if (activeVerseUrl === img.url) onSetVerseBackground(undefined);
                  removeImage(img.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section fond versets actif */}
      {activeVerseUrl && (
        <section>
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <img src={activeVerseUrl} alt="Fond actif" className="h-8 w-14 object-cover rounded" />
              <div>
                <p className="text-xs font-medium text-amber-400">Fond versets actif</p>
                <p className="text-[10px] text-muted-foreground/60">Affiché sur tous les versets</p>
              </div>
            </div>
            <button
              onClick={() => onSetVerseBackground(undefined)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Section logo d'église */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Logo d'église
        </h3>
        {settings.churchLogo ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/40">
            <div className="flex items-center gap-3">
              <img
                src={settings.churchLogo}
                alt="Logo"
                className="h-10 w-10 object-contain rounded bg-secondary p-1 border border-border"
              />
              <div>
                <p className="text-sm font-medium">{settings.churchName || 'Logo'}</p>
                <p className="text-[10px] text-muted-foreground/60">Superposé en haut des présentations</p>
              </div>
            </div>
            <button
              onClick={() => onSetLogo(!theme.showChurchLogo)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                theme.showChurchLogo ? 'text-amber-400' : 'text-muted-foreground'
              }`}
            >
              {theme.showChurchLogo
                ? <ToggleRight className="h-5 w-5" />
                : <ToggleLeft className="h-5 w-5" />
              }
              {theme.showChurchLogo ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-center">
            <p className="text-xs text-muted-foreground/60">
              Ajoutez un logo dans les <strong>Paramètres</strong> pour l'activer
            </p>
          </div>
        )}
      </section>

      {/* Section contrôles thème rapides */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Typographie versets
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-14">Taille</span>
            {(['small','medium','large','xlarge'] as const).map(sz => (
              <button
                key={sz}
                onClick={() => onThemeChange({ ...theme, fontSize: sz })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  theme.fontSize === sz
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                }`}
              >
                {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : sz === 'large' ? 'L' : 'XL'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-14">Police</span>
            {(['serif','sans-serif'] as const).map(ff => (
              <button
                key={ff}
                onClick={() => onThemeChange({ ...theme, fontFamily: ff })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  theme.fontFamily === ff
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                }`}
              >
                {ff === 'serif' ? 'Serif' : 'Sans'}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
