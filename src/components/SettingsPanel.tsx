/* Panneau Paramètres de l'église — sauvegarde localStorage */
import { useState, useEffect } from 'react';
import { X, Upload, Church, Monitor, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ChurchSettings {
  churchName: string;
  churchLogo: string; // base64 data URL
  defaultFont: string;
  defaultFontSize: 'normal' | 'large' | 'xlarge';
  transitionSpeed: number; // ms
  bibleVersion: string;
}

const STORAGE_KEY = 'biblecast-settings';

const DEFAULT_SETTINGS: ChurchSettings = {
  churchName: '',
  churchLogo: '',
  defaultFont: 'Merriweather',
  defaultFontSize: 'large',
  transitionSpeed: 600,
  bibleVersion: 'LSG 1910',
};

export function loadSettings(): ChurchSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: ChurchSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const FONTS = ['Merriweather', 'Lato', 'Georgia', 'Arial'];
const FONT_SIZES: { label: string; value: ChurchSettings['defaultFontSize'] }[] = [
  { label: 'Normale', value: 'normal' },
  { label: 'Grande', value: 'large' },
  { label: 'Très grande', value: 'xlarge' },
];
const SPEEDS: { label: string; value: number }[] = [
  { label: 'Rapide', value: 300 },
  { label: 'Normale', value: 600 },
  { label: 'Lente', value: 1000 },
];

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChurchSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/svg+xml,image/jpeg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSettings(prev => ({ ...prev, churchLogo: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Church className="h-5 w-5 text-primary" />
            Paramètres
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Nom de l'église */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Church className="h-4 w-4" /> Nom de l'église
            </Label>
            <Input
              value={settings.churchName}
              onChange={(e) => setSettings(prev => ({ ...prev, churchName: e.target.value }))}
              placeholder="Ex: Église de la Grâce"
              className="bg-secondary border-border"
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Logo de l'église</Label>
            <div className="flex items-center gap-3">
              {settings.churchLogo ? (
                <div className="relative">
                  <img src={settings.churchLogo} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-secondary p-1" />
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, churchLogo: '' }))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="h-14 w-14 rounded-lg bg-secondary border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <Button size="sm" variant="secondary" onClick={handleLogoUpload} className="gap-1.5 transition-smooth">
                <Upload className="h-4 w-4" /> {settings.churchLogo ? 'Changer' : 'Uploader'}
              </Button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-border" />

          {/* Préférences TV */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Monitor className="h-4 w-4 text-primary" /> Préférences d'affichage TV
            </h3>

            {/* Police par défaut */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Police par défaut</Label>
              <div className="flex gap-2">
                {FONTS.map(font => (
                  <Button
                    key={font}
                    size="sm"
                    variant={settings.defaultFont === font ? 'default' : 'secondary'}
                    onClick={() => setSettings(prev => ({ ...prev, defaultFont: font }))}
                    className="flex-1 text-xs transition-smooth"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </Button>
                ))}
              </div>
            </div>

            {/* Taille de police par défaut */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Taille par défaut</Label>
              <div className="flex gap-2">
                {FONT_SIZES.map(fs => (
                  <Button
                    key={fs.value}
                    size="sm"
                    variant={settings.defaultFontSize === fs.value ? 'default' : 'secondary'}
                    onClick={() => setSettings(prev => ({ ...prev, defaultFontSize: fs.value }))}
                    className="flex-1 text-xs transition-smooth"
                  >
                    {fs.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Vitesse de transition */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Vitesse de transition</Label>
              <div className="flex gap-2">
                {SPEEDS.map(sp => (
                  <Button
                    key={sp.value}
                    size="sm"
                    variant={settings.transitionSpeed === sp.value ? 'default' : 'secondary'}
                    onClick={() => setSettings(prev => ({ ...prev, transitionSpeed: sp.value }))}
                    className="flex-1 text-xs transition-smooth"
                  >
                    {sp.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-border" />

          {/* Préférences présentateur */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Type className="h-4 w-4 text-primary" /> Préférences présentateur
            </h3>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Version biblique affichée</Label>
              <Input
                value={settings.bibleVersion}
                onChange={(e) => setSettings(prev => ({ ...prev, bibleVersion: e.target.value }))}
                placeholder="Ex: LSG 1910, NEG..."
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button onClick={onClose} className="btn-gold px-6">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
