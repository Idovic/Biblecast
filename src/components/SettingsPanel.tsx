/* Panneau Paramètres de l'église — sauvegarde localStorage */
import { useState, useEffect } from 'react';
import { X, Upload, Church, Monitor, Type, Layers, Eye, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface ChurchSettings {
  churchName: string;
  churchLogo: string;
  defaultFont: string;
  defaultFontSize: 'normal' | 'large' | 'xlarge';
  transitionSpeed: number;
  bibleVersion: string;
  showVerseReference: boolean;
  textShadowDefault: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  verseQuotes: boolean;
  displayBgBlur: boolean;
}

const STORAGE_KEY = 'biblecast-settings';

const DEFAULT_SETTINGS: ChurchSettings = {
  churchName: '',
  churchLogo: '',
  defaultFont: 'Merriweather',
  defaultFontSize: 'large',
  transitionSpeed: 600,
  bibleVersion: 'LSG 1910',
  showVerseReference: true,
  textShadowDefault: false,
  autoAdvance: false,
  autoAdvanceDelay: 5000,
  lineSpacing: 'normal',
  verseQuotes: true,
  displayBgBlur: false,
};

export function loadSettings(): ChurchSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: ChurchSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const FONTS = [
  { label: 'Merriweather', value: 'Merriweather', style: 'serif' },
  { label: 'Lato', value: 'Lato', style: 'sans-serif' },
  { label: 'Georgia', value: 'Georgia', style: 'serif' },
  { label: 'Arial', value: 'Arial', style: 'sans-serif' },
  { label: 'Palatino', value: 'Palatino Linotype', style: 'serif' },
  { label: 'Trebuchet', value: 'Trebuchet MS', style: 'sans-serif' },
];

const SPEEDS = [
  { label: 'Rapide (300ms)', value: 300 },
  { label: 'Normal (600ms)', value: 600 },
  { label: 'Lent (1s)', value: 1000 },
  { label: 'Très lent (1.5s)', value: 1500 },
];

const AUTO_DELAYS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '8s', value: 8000 },
  { label: '12s', value: 12000 },
  { label: '20s', value: 20000 },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm transition-all',
        checked ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
      )}
    >
      <span>{label}</span>
      <div className={cn('w-9 h-5 rounded-full transition-colors relative', checked ? 'bg-primary' : 'bg-border')}>
        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </div>
    </button>
  );
}

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const set = <K extends keyof ChurchSettings>(key: K, val: ChurchSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/svg+xml,image/jpeg,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => set('churchLogo', ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Church className="h-5 w-5 text-primary" />
            Paramètres
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="church" className="flex flex-col" style={{ maxHeight: '75vh' }}>
          <TabsList className="mx-4 mt-3 bg-secondary/80 shrink-0">
            <TabsTrigger value="church" className="flex-1 text-xs gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Church className="h-3.5 w-3.5" /> Église
            </TabsTrigger>
            <TabsTrigger value="display" className="flex-1 text-xs gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Monitor className="h-3.5 w-3.5" /> Affichage
            </TabsTrigger>
            <TabsTrigger value="presentation" className="flex-1 text-xs gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Layers className="h-3.5 w-3.5" /> Présentation
            </TabsTrigger>
          </TabsList>

          {/* ── Onglet Église ── */}
          <TabsContent value="church" className="overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Church className="h-3.5 w-3.5" /> Nom de l'église
              </Label>
              <Input value={settings.churchName}
                onChange={(e) => set('churchName', e.target.value)}
                placeholder="Ex: Église de la Grâce"
                className="bg-secondary border-border" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <div className="flex items-center gap-3">
                {settings.churchLogo ? (
                  <div className="relative">
                    <img src={settings.churchLogo} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-secondary p-1 border border-border" />
                    <button onClick={() => set('churchLogo', '')}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-secondary border border-dashed border-border flex items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <Button size="sm" variant="secondary" onClick={handleLogoUpload} className="gap-1.5">
                  <Upload className="h-4 w-4" /> {settings.churchLogo ? 'Changer' : 'Uploader'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Version biblique affichée
              </Label>
              <Input value={settings.bibleVersion}
                onChange={(e) => set('bibleVersion', e.target.value)}
                placeholder="Ex: LSG 1910, NEG..."
                className="bg-secondary border-border" />
            </div>
          </TabsContent>

          {/* ── Onglet Affichage ── */}
          <TabsContent value="display" className="overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Police de caractères
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map(f => (
                  <button key={f.value} onClick={() => set('defaultFont', f.value)}
                    style={{ fontFamily: f.value }}
                    className={cn('py-2 px-3 rounded-lg border text-sm transition-all',
                      settings.defaultFont === f.value ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                    )}>
                    {f.label}
                    <span className="block text-[10px] opacity-50">{f.style}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Vitesse de transition</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPEEDS.map(sp => (
                  <button key={sp.value} onClick={() => set('transitionSpeed', sp.value)}
                    className={cn('py-2 px-3 rounded-lg border text-xs transition-all',
                      settings.transitionSpeed === sp.value ? 'border-primary/50 bg-primary/10 text-foreground font-medium' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                    )}>
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Interlignage du texte
              </Label>
              <div className="flex gap-2">
                {(['tight', 'normal', 'relaxed'] as const).map(ls => (
                  <button key={ls} onClick={() => set('lineSpacing', ls)}
                    className={cn('flex-1 py-2 rounded-lg border text-xs transition-all',
                      settings.lineSpacing === ls ? 'border-primary/50 bg-primary/10 text-foreground font-medium' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                    )}>
                    {ls === 'tight' ? 'Compact' : ls === 'normal' ? 'Normal' : 'Aéré'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Options visuelles
              </Label>
              <div className="space-y-2">
                <Toggle checked={settings.showVerseReference} onChange={v => set('showVerseReference', v)}
                  label="Afficher la référence (livre chap:v)" />
                <Toggle checked={settings.verseQuotes} onChange={v => set('verseQuotes', v)}
                  label="Guillemets autour des versets" />
                <Toggle checked={settings.textShadowDefault} onChange={v => set('textShadowDefault', v)}
                  label="Ombre du texte par défaut" />
                <Toggle checked={settings.displayBgBlur} onChange={v => set('displayBgBlur', v)}
                  label="Flou d'arrière-plan sur fond sombre" />
              </div>
            </div>
          </TabsContent>

          {/* ── Onglet Présentation ── */}
          <TabsContent value="presentation" className="overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" /> Avance automatique
              </Label>
              <Toggle checked={settings.autoAdvance} onChange={v => set('autoAdvance', v)}
                label="Avancer automatiquement dans la timeline" />
              {settings.autoAdvance && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Délai entre chaque item</Label>
                  <div className="flex gap-2 flex-wrap">
                    {AUTO_DELAYS.map(d => (
                      <button key={d.value} onClick={() => set('autoAdvanceDelay', d.value)}
                        className={cn('px-3 py-1.5 rounded-lg border text-xs transition-all',
                          settings.autoAdvanceDelay === d.value ? 'border-primary/50 bg-primary/10 text-foreground font-medium' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                        )}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Raccourcis rapides
              </Label>
              <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
                {[
                  ['Entrée', 'Projeter l\'aperçu actuel'],
                  ['→ / ↓', 'Suivant (timeline)'],
                  ['← / ↑', 'Précédent (timeline)'],
                  ['Échap', 'Effacer l\'écran'],
                  ['Double-clic', 'Projeter un verset directement'],
                  ['?', 'Afficher/masquer l\'aide'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-3">
                    <kbd className="px-2 py-0.5 rounded border border-border font-mono bg-background text-foreground text-[10px] min-w-[60px] text-center">{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
          <Button onClick={onClose} className="btn-gold px-6">Fermer</Button>
        </div>
      </div>
    </div>
  );
}
