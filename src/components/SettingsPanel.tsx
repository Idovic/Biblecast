/* Panneau Paramètres de l'église — sauvegarde localStorage */
import { useState } from 'react';
import { X, Upload, Church, Monitor, Type, Layers, Eye, Timer, Sparkles, Clock, BookOpen, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { importBDS, clearBDSCache } from '@/lib/bible';

export interface ChurchSettings {
  churchName: string;
  churchLogo: string;
  defaultFont: string;
  defaultFontSize: 'normal' | 'large' | 'xlarge';
  transitionSpeed: number;
  bibleVersion: string;
  bible2Version: string;
  showVerseReference: boolean;
  textShadowDefault: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  verseQuotes: boolean;
  displayBgBlur: boolean;
  showClock: boolean;
  showClockSeconds: boolean;
  showClockDate: boolean;
  showVerseOfDay: boolean;
  verseOfDayMode: 'random' | 'manual';
  verseOfDayRef: string;
  autoSleep: boolean;
  autoSleepDelay: number;
  splitLayout: 'horizontal' | 'vertical';
  keepScreenOn: boolean;
}

const STORAGE_KEY = 'biblecast-settings';

export const DEFAULT_SETTINGS: ChurchSettings = {
  churchName: '',
  churchLogo: '',
  defaultFont: 'Merriweather',
  defaultFontSize: 'large',
  transitionSpeed: 600,
  bibleVersion: 'LSG 1910',
  bible2Version: 'BDS',
  showVerseReference: true,
  textShadowDefault: false,
  autoAdvance: false,
  autoAdvanceDelay: 5000,
  lineSpacing: 'normal',
  verseQuotes: true,
  displayBgBlur: false,
  showClock: true,
  showClockSeconds: false,
  showClockDate: false,
  showVerseOfDay: true,
  verseOfDayMode: 'random',
  verseOfDayRef: '',
  autoSleep: false,
  autoSleepDelay: 5,
  splitLayout: 'horizontal',
  keepScreenOn: false,
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
  onBible2Imported?: () => void;
}

export default function SettingsPanel({ onClose, onBible2Imported }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);
  const [bdsStatus, setBdsStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const set = <K extends keyof ChurchSettings>(key: K, val: ChurchSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/svg+xml,image/jpeg,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 300 * 1024) {
        const proceed = window.confirm(
          `Ce logo fait ${Math.round(file.size / 1024)} Ko. Pour éviter un problème de stockage, privilégiez une image de moins de 300 Ko (PNG transparent recommandé). Continuer quand même ?`
        );
        if (!proceed) return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => set('churchLogo', ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleBDSImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (typeof data === 'object' && !Array.isArray(data)) {
            importBDS(data);
            clearBDSCache();
            setBdsStatus('success');
            onBible2Imported?.();
            setTimeout(() => setBdsStatus('idle'), 3000);
          } else {
            setBdsStatus('error');
            setTimeout(() => setBdsStatus('idle'), 3000);
          }
        } catch {
          setBdsStatus('error');
          setTimeout(() => setBdsStatus('idle'), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in">
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
            <TabsTrigger value="bible2" className="flex-1 text-xs gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Database className="h-3.5 w-3.5" /> Bibles
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
                <Type className="h-3.5 w-3.5" /> Version biblique principale
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
                  label="Flou d'arrière-plan sur fond image" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Écran de veille
              </Label>
              <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <Toggle checked={settings.showClock} onChange={v => set('showClock', v)}
                  label="Afficher l'horloge" />
                {settings.showClock && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                    <Toggle checked={settings.showClockSeconds} onChange={v => set('showClockSeconds', v)}
                      label="Afficher les secondes (HH:MM:SS)" />
                    <Toggle checked={settings.showClockDate} onChange={v => set('showClockDate', v)}
                      label="Afficher la date sous l'horloge" />
                  </div>
                )}
                <div className="space-y-2">
                  <Toggle checked={settings.autoSleep} onChange={v => set('autoSleep', v)}
                    label="Veille automatique" />
                  {settings.autoSleep && (
                    <div className="pl-4 border-l-2 border-primary/20">
                      <Label className="text-[10px] text-muted-foreground mb-2 block">
                        Passer en veille après (sans projection)
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {[1, 3, 5, 10, 15].map(m => (
                          <button key={m} onClick={() => set('autoSleepDelay', m)}
                            className={cn('px-3 py-1.5 rounded-lg border text-xs transition-all',
                              settings.autoSleepDelay === m
                                ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                                : 'border-border/40 bg-secondary/60 text-muted-foreground hover:bg-secondary'
                            )}>
                            {m} min
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Toggle checked={settings.showVerseOfDay} onChange={v => set('showVerseOfDay', v)}
                    label="Verset du jour" />
                  {settings.showVerseOfDay && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                      <div className="flex gap-2">
                        {(['random', 'manual'] as const).map(mode => (
                          <button key={mode}
                            onClick={() => set('verseOfDayMode', mode)}
                            className={cn(
                              'flex-1 py-1.5 px-3 rounded-lg border text-xs transition-all',
                              settings.verseOfDayMode === mode
                                ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                                : 'border-border/40 bg-secondary/60 text-muted-foreground hover:bg-secondary'
                            )}>
                            <BookOpen className="h-3 w-3 inline mr-1.5" />
                            {mode === 'random' ? 'Aléatoire (quotidien)' : 'Manuel'}
                          </button>
                        ))}
                      </div>
                      {settings.verseOfDayMode === 'manual' && (
                        <div>
                          <Label className="text-[10px] text-muted-foreground mb-1 block">
                            Référence (ex : Jean 3:16)
                          </Label>
                          <Input
                            value={settings.verseOfDayRef}
                            onChange={e => set('verseOfDayRef', e.target.value)}
                            placeholder="Jean 3:16"
                            className="bg-secondary text-sm h-8"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Onglet Bibles ── */}
          <TabsContent value="bible2" className="overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Bible secondaire (double version)
              </Label>
              <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">Nom affiché de la 2ème version</Label>
                  <Input value={settings.bible2Version}
                    onChange={(e) => set('bible2Version', e.target.value)}
                    placeholder="Ex: BDS, LSG, NIV..."
                    className="bg-secondary border-border text-sm h-8" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">Importer le fichier JSON de la Bible secondaire</Label>
                  <Button size="sm" variant="secondary" onClick={handleBDSImport} className="w-full gap-2">
                    <Upload className="h-4 w-4" />
                    Importer un fichier Bible (JSON)
                  </Button>
                  {bdsStatus === 'success' && (
                    <p className="text-xs text-green-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      Bible importée avec succès — redémarrez si nécessaire
                    </p>
                  )}
                  {bdsStatus === 'error' && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      Fichier invalide — format JSON biblique attendu
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                    Format attendu : {`{ "Genèse": { "1": { "1": "Au commencement..." } } }`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground">Disposition de l'écran partagé</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'horizontal', label: 'Haut / Bas', desc: '▭ ▭' },
                      { value: 'vertical', label: 'Gauche / Droite', desc: '▯▯' },
                    ] as const).map(opt => (
                      <button key={opt.value}
                        onClick={() => set('splitLayout', opt.value)}
                        className={cn(
                          'py-3 px-3 rounded-lg border text-xs transition-all flex flex-col items-center gap-1',
                          settings.splitLayout === opt.value
                            ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                            : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                        )}>
                        <span className="text-base">{opt.desc}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Onglet Présentation ── */}
          <TabsContent value="presentation" className="overflow-y-auto px-6 py-4 space-y-5">
            {/* Avance automatique */}
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

            {/* Gestes tactiles */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Gestes tactiles — Écran Display (TV)
              </Label>
              <div className="bg-secondary/40 rounded-xl p-4 space-y-3 text-xs text-muted-foreground">
                {[
                  { icon: '👆', gesture: 'Double-tap verset', action: 'Projeter directement sur TV' },
                  { icon: '👈', gesture: 'Glisser ← (Display)', action: 'Verset / slide suivant(e)' },
                  { icon: '👉', gesture: 'Glisser → (Display)', action: 'Verset / slide précédent(e)' },
                  { icon: '☑️', gesture: 'Sélection multiple', action: 'Sélectionner plusieurs versets' },
                  { icon: '🎞️', gesture: 'Bouton ▶ (timeline)', action: 'Lancer l\'avance automatique' },
                ].map(({ icon, gesture, action }) => (
                  <div key={gesture} className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="font-medium text-foreground text-[11px]">{gesture}</p>
                      <p className="opacity-70 text-[10px]">{action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comportement tablette */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" /> Comportement tablette
              </Label>
              <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
                <Toggle
                  checked={settings.keepScreenOn ?? false}
                  onChange={v => set('keepScreenOn', v)}
                  label="Garder l'écran allumé pendant la présentation"
                />
                <p className="text-[10px] text-muted-foreground/60 pl-0.5 leading-relaxed">
                  Empêche la tablette de se mettre en veille automatiquement pendant le culte.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="px-6 py-3 border-t border-border/40 text-center">
          <p className="text-[10px] text-muted-foreground/40">
            Développé avec ❤️ par le Frère Malachie
          </p>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
          <Button onClick={onClose} className="btn-gold px-6">Fermer</Button>
        </div>
      </div>
    </div>
  );
}
