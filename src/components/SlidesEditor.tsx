/* Éditeur de slides personnalisées */
import { useState, useRef } from 'react';
import {
  Plus, Trash2, Upload, Send, Copy, Tag,
  AlignCenter, Type, BookOpen, Square, List, ChevronDown, Sparkles, Palette, Image
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CustomSlide, SlideType } from '@/types/bible';
import { loadSettings } from '@/components/SettingsPanel';

function ColResizeHandle() {
  const [dragging, setDragging] = useState(false);
  return (
    <PanelResizeHandle
      onDragging={setDragging}
      className={cn(
        'group relative flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors z-10 w-[6px]',
        dragging ? 'bg-primary/10' : 'bg-transparent hover:bg-primary/[0.07]'
      )}
    >
      <div className={cn('absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-all duration-150',
        dragging ? 'bg-primary/70' : 'bg-border group-hover:bg-primary/50')} />
      <div className={cn('relative z-10 flex flex-col gap-[3px] transition-opacity duration-150',
        dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={cn('block w-1 h-1 rounded-full',
            dragging ? 'bg-primary' : 'bg-primary/60')} />
        ))}
      </div>
    </PanelResizeHandle>
  );
}

interface SlidesEditorProps {
  slides: CustomSlide[];
  onSlidesChange: (slides: CustomSlide[]) => void;
  onSelectSlide: (slide: CustomSlide) => void;
  onSendSlide: (slide: CustomSlide) => void;
}

const SOLID_COLORS = [
  '#000000', '#0a0a12', '#1a1a2e', '#0a1628', '#1a1a3e',
  '#2a0a14', '#3d0a0a', '#0a1f0f', '#0f2027', '#1a0a3e',
  '#2d1b69', '#0f3460', '#1b4332', '#7b2d00', '#3d2b1f',
  '#1c1c1c', '#2c3e50', '#17252a', '#1a1a1a', '#0d1117',
];

const TEXT_COLORS = [
  '#ffffff', '#f8f8f8', '#f4a261', '#ffd700', '#a8e6cf',
  '#89cff0', '#ffb3ba', '#ffe4b5', '#e0e0e0', '#c0c0c0',
];

const GRADIENT_PRESETS = [
  { label: 'Nuit profonde', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: 'Océan', value: 'linear-gradient(135deg, #0a1628 0%, #1a3a6e 50%, #0f3460 100%)' },
  { label: 'Aurore', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #e96c4c 100%)' },
  { label: 'Forêt', value: 'linear-gradient(135deg, #0a1f0f 0%, #1b5e20 80%, #2e7d32 100%)' },
  { label: 'Bordeaux', value: 'linear-gradient(135deg, #1a0505 0%, #4a0a14 50%, #7b1a28 100%)' },
  { label: 'Ardoise', value: 'linear-gradient(135deg, #1c1c1c 0%, #2c3e50 50%, #3d566e 100%)' },
  { label: 'Améthyste', value: 'linear-gradient(135deg, #1a0a3e 0%, #4a1a8e 50%, #7b2fbe 100%)' },
  { label: 'Or et nuit', value: 'linear-gradient(135deg, #1a1400 0%, #3d3200 50%, #a08000 100%)' },
  { label: 'Crépuscule', value: 'linear-gradient(135deg, #0d1117 0%, #161b22 40%, #21262d 100%)' },
  { label: 'Lune', value: 'linear-gradient(180deg, #0a0a18 0%, #1a1a3e 50%, #2a2a5e 100%)' },
  { label: 'Feu doux', value: 'linear-gradient(135deg, #1a0505 0%, #3d1200 50%, #7b2800 100%)' },
  { label: 'Aube', value: 'linear-gradient(180deg, #0f0c29 0%, #2d1b69 40%, #e96c4c 100%)' },
];

const SLIDE_TYPES: { type: SlideType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'text-title', label: 'Texte + Titre', icon: <Type className="h-3.5 w-3.5" />, desc: 'Titre et texte libre' },
  { type: 'title-only', label: 'Titre seul', icon: <AlignCenter className="h-3.5 w-3.5" />, desc: 'Grand titre centré' },
  { type: 'verse-title', label: 'Verset + Titre', icon: <BookOpen className="h-3.5 w-3.5" />, desc: 'Titre + texte biblique' },
  { type: 'blank', label: 'Vide', icon: <Square className="h-3.5 w-3.5" />, desc: 'Fond seul, sans texte' },
  { type: 'bullet-list', label: 'Liste à puces', icon: <List className="h-3.5 w-3.5" />, desc: 'Points numérotés' },
];

const TYPE_COLORS: Record<SlideType, string> = {
  'text-title': 'bg-blue-500/20 text-blue-400',
  'title-only': 'bg-purple-500/20 text-purple-400',
  'verse-title': 'bg-primary/20 text-primary',
  'blank': 'bg-gray-500/20 text-gray-400',
  'bullet-list': 'bg-green-500/20 text-green-400',
};

const TYPE_LABELS: Record<SlideType, string> = {
  'text-title': 'Texte', 'title-only': 'Titre',
  'verse-title': 'Verset', 'blank': 'Vide', 'bullet-list': 'Liste',
};

const TEMPLATES: { category: string; items: Partial<CustomSlide>[] }[] = [
  {
    category: 'Culte',
    items: [
      { title: 'Bienvenue !', content: 'Nous sommes heureux de vous accueillir.', slideType: 'text-title', backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #302b63 100%)' },
      { title: 'Temps de louange', content: '', slideType: 'title-only', backgroundGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' },
      { title: 'Prédication', content: '', slideType: 'title-only', backgroundGradient: 'linear-gradient(135deg, #0a1628 0%, #1a3a6e 100%)' },
      { title: 'Temps de prière', content: '', slideType: 'title-only', backgroundGradient: 'linear-gradient(135deg, #1a0505 0%, #4a0a14 100%)' },
      { title: 'Offrande', content: 'Donnez selon les dispositions de votre cœur.', slideType: 'text-title', backgroundGradient: 'linear-gradient(135deg, #0a1f0f 0%, #1b5e20 100%)' },
      { title: 'Merci d\'être venu !', content: 'Que Dieu vous bénisse.', slideType: 'text-title', backgroundGradient: 'linear-gradient(135deg, #1a1400 0%, #3d3200 100%)' },
    ],
  },
  {
    category: 'Annonces',
    items: [
      { title: 'Annonces', bullets: ['Annonce 1', 'Annonce 2', 'Annonce 3'], slideType: 'bullet-list', backgroundGradient: 'linear-gradient(135deg, #1a0a3e 0%, #4a1a8e 100%)' },
      { title: 'Événement à venir', content: 'Date · Lieu · Horaire', slideType: 'text-title', backgroundColor: '#1a1a3e' },
      { title: 'Groupe de cellule', content: 'Rejoignez-nous cette semaine !', slideType: 'text-title', backgroundColor: '#1a1a3e' },
    ],
  },
];

function getSlideBackground(slide: CustomSlide): React.CSSProperties {
  if (slide.backgroundImage) return { backgroundImage: `url(${slide.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  if (slide.backgroundGradient) return { background: slide.backgroundGradient };
  if (slide.backgroundColor) return { backgroundColor: slide.backgroundColor };
  return { backgroundColor: '#1a1a2e' };
}

export default function SlidesEditor({ slides, onSlidesChange, onSelectSlide, onSendSlide }: SlidesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bgTab, setBgTab] = useState<'solid' | 'gradient'>('solid');
  const dragItemRef = useRef<string | null>(null);

  const createSlide = (overrides: Partial<CustomSlide> = {}): CustomSlide => ({
    id: crypto.randomUUID(),
    title: '',
    content: '',
    slideType: 'text-title',
    bullets: [''],
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    textShadow: false,
    ...overrides,
  });

  const addSlide = (overrides: Partial<CustomSlide> = {}) => {
    const newSlide = createSlide(overrides);
    onSlidesChange([...slides, newSlide]);
    setEditingId(newSlide.id);
    onSelectSlide(newSlide);
  };

  const duplicateSlide = (slide: CustomSlide) => {
    const dup: CustomSlide = { ...slide, id: crypto.randomUUID(), title: slide.title ? `${slide.title} (copie)` : '' };
    const idx = slides.findIndex(s => s.id === slide.id);
    const arr = [...slides];
    arr.splice(idx + 1, 0, dup);
    onSlidesChange(arr);
    setEditingId(dup.id);
    onSelectSlide(dup);
  };

  const updateSlide = (id: string, updates: Partial<CustomSlide>) => {
    const updated = slides.map(s => s.id === id ? { ...s, ...updates } : s);
    onSlidesChange(updated);
    const slide = updated.find(s => s.id === id);
    if (slide) onSelectSlide(slide);
  };

  const removeSlide = (id: string) => {
    onSlidesChange(slides.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => updateSlide(id, { backgroundImage: e.target?.result as string, backgroundColor: undefined, backgroundGradient: undefined });
    reader.readAsDataURL(file);
  };

  const handleDragStart = (id: string) => { dragItemRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    const fromId = dragItemRef.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const arr = [...slides];
    const fromIdx = arr.findIndex(s => s.id === fromId);
    const toIdx = arr.findIndex(s => s.id === targetId);
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    onSlidesChange(arr);
    setDragOverId(null);
    dragItemRef.current = null;
  };
  const handleDragEnd = () => { setDragOverId(null); dragItemRef.current = null; };

  const editing = slides.find(s => s.id === editingId);

  const addBullet = (id: string) => {
    const slide = slides.find(s => s.id === id);
    if (slide) updateSlide(id, { bullets: [...(slide.bullets || []), ''] });
  };
  const updateBullet = (id: string, idx: number, value: string) => {
    const slide = slides.find(s => s.id === id);
    if (!slide) return;
    const bullets = [...(slide.bullets || [])];
    bullets[idx] = value;
    updateSlide(id, { bullets });
  };
  const removeBullet = (id: string, idx: number) => {
    const slide = slides.find(s => s.id === id);
    if (slide) updateSlide(id, { bullets: (slide.bullets || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 btn-gold">
              <Plus className="h-4 w-4" /> Nouvelle slide <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Types</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => addSlide({ slideType: 'text-title' })}><Type className="h-4 w-4 mr-2 text-blue-400" /> Texte + Titre</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addSlide({ slideType: 'title-only' })}><AlignCenter className="h-4 w-4 mr-2 text-purple-400" /> Titre seul</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addSlide({ slideType: 'verse-title' })}><BookOpen className="h-4 w-4 mr-2 text-primary" /> Verset + Titre</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addSlide({ slideType: 'bullet-list', bullets: [''] })}><List className="h-4 w-4 mr-2 text-green-400" /> Liste à puces</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addSlide({ slideType: 'blank' })}><Square className="h-4 w-4 mr-2 text-gray-400" /> Slide vide</DropdownMenuItem>
            <DropdownMenuSeparator />
            {TEMPLATES.map(cat => (
              <div key={cat.category}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{cat.category}</DropdownMenuLabel>
                {cat.items.map((tpl, i) => (
                  <DropdownMenuItem key={i} onClick={() => addSlide(tpl)}>
                    <Tag className="h-4 w-4 mr-2 text-primary/70" /> {tpl.title}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
      </div>

      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Liste des slides */}
        <Panel defaultSize={42} minSize={25} maxSize={65} className="overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <div className="p-2 space-y-1.5 w-full">
              {slides.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-8 px-2">Aucune slide.<br />Cliquez "Nouvelle slide".</p>
              )}
              {slides.map((slide) => {
                const sType: SlideType = slide.slideType || 'text-title';
                const bgStyle = getSlideBackground(slide);
                return (
                  <div
                    key={slide.id}
                    draggable
                    onDragStart={() => handleDragStart(slide.id)}
                    onDragOver={(e) => handleDragOver(e, slide.id)}
                    onDrop={() => handleDrop(slide.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { setEditingId(slide.id); onSelectSlide(slide); }}
                    className={cn(
                      'p-2.5 rounded-lg cursor-pointer transition-all select-none overflow-hidden w-full',
                      editingId === slide.id ? 'bg-primary/15 border border-primary/40' : 'bg-secondary/60 hover:bg-surface-hover border border-transparent',
                      dragOverId === slide.id && 'border-primary border-dashed opacity-60'
                    )}
                  >
                    {/* Mini thumbnail du fond */}
                    <div className="h-10 w-full rounded-md mb-2 overflow-hidden relative flex items-center justify-center" style={bgStyle}>
                      {slide.backgroundImage && <div className="absolute inset-0 bg-black/20" />}
                      <span className="relative z-10 text-[10px] font-bold text-white/80 truncate px-1 text-center leading-tight">
                        {slide.title || <span className="italic opacity-50">Sans titre</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLORS[sType]}`}>{TYPE_LABELS[sType]}</span>
                      <p className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                        {sType === 'bullet-list' ? (slide.bullets || []).filter(Boolean).join(' · ') : slide.content || ''}
                      </p>
                      <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => onSendSlide(slide)}><Send className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => duplicateSlide(slide)}><Copy className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeSlide(slide.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <ColResizeHandle />

        {/* Éditeur */}
        <Panel className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {!editing ? (
                <p className="text-muted-foreground text-sm text-center mt-8">Sélectionnez ou créez une slide.</p>
              ) : (
                <div className="space-y-5">
                  {/* Type selector */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Type de slide</Label>
                    <div className="space-y-1">
                      {SLIDE_TYPES.map(({ type, label, icon, desc }) => (
                        <button key={type} onClick={() => updateSlide(editing.id, { slideType: type })}
                          className={cn('flex items-center gap-2.5 w-full p-2 rounded-lg border text-left transition-all text-xs',
                            (editing.slideType || 'text-title') === type
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                          )}>
                          <span className={`p-1 rounded ${TYPE_COLORS[type]}`}>{icon}</span>
                          <span className="font-medium">{label}</span>
                          <span className="text-muted-foreground ml-1">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Titre */}
                  {(editing.slideType || 'text-title') !== 'blank' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Titre</Label>
                      <Input value={editing.title} onChange={(e) => updateSlide(editing.id, { title: e.target.value })}
                        placeholder="Titre de la slide" className="bg-secondary mt-1" />
                    </div>
                  )}

                  {/* Contenu */}
                  {((editing.slideType || 'text-title') === 'text-title' || editing.slideType === 'verse-title') && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {editing.slideType === 'verse-title' ? 'Texte du verset' : 'Contenu'}
                      </Label>
                      <Textarea value={editing.content}
                        onChange={(e) => updateSlide(editing.id, { content: e.target.value })}
                        placeholder={editing.slideType === 'verse-title' ? 'Ex: Car Dieu a tant aimé le monde...' : 'Texte libre...'}
                        className="bg-secondary min-h-[90px] mt-1" />
                    </div>
                  )}

                  {/* Liste à puces */}
                  {editing.slideType === 'bullet-list' && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Points</Label>
                      <div className="space-y-2">
                        {(editing.bullets || []).map((bullet, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="text-primary text-sm shrink-0">•</span>
                            <Input value={bullet} onChange={(e) => updateBullet(editing.id, idx, e.target.value)}
                              placeholder={`Point ${idx + 1}`} className="bg-secondary flex-1 h-8 text-sm" />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeBullet(editing.id, idx)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => addBullet(editing.id)} className="w-full gap-1.5 h-8 text-xs mt-1">
                          <Plus className="h-3 w-3" /> Ajouter un point
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─── Couleur du texte ─── */}
                  {(editing.slideType || 'text-title') !== 'blank' && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" /> Couleur du texte
                      </Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {TEXT_COLORS.map(color => (
                          <button key={color} onClick={() => updateSlide(editing.id, { textColor: color })}
                            className={cn('w-7 h-7 rounded-full border-2 transition-all',
                              editing.textColor === color ? 'border-primary scale-110' : 'border-border/50 hover:border-primary/50'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        <div className="relative" title="Couleur personnalisée">
                          <input type="color"
                            value={editing.textColor || '#ffffff'}
                            onChange={(e) => updateSlide(editing.id, { textColor: e.target.value })}
                            className="w-7 h-7 rounded-full cursor-pointer border border-border/50 bg-transparent p-0.5"
                            style={{ appearance: 'none' }}
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] leading-none">🎨</span>
                        </div>
                      </div>
                      {/* Ombre du texte */}
                      <button
                        onClick={() => updateSlide(editing.id, { textShadow: !editing.textShadow })}
                        className={cn('mt-2 flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-all',
                          editing.textShadow ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                        )}
                      >
                        <Sparkles className="h-3 w-3" />
                        Ombre du texte {editing.textShadow ? '(activée)' : '(désactivée)'}
                      </button>
                    </div>
                  )}

                  {/* ─── Fond ─── */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Fond</Label>

                    {/* Tabs: Couleur | Dégradé | Image */}
                    <div className="flex gap-1 mb-3">
                      {(['solid', 'gradient'] as const).map(tab => (
                        <button key={tab} onClick={() => setBgTab(tab)}
                          className={cn('flex-1 py-1.5 text-xs rounded-lg border transition-all',
                            bgTab === tab ? 'border-primary/50 bg-primary/10 text-foreground font-medium' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:bg-secondary/80'
                          )}>
                          {tab === 'solid' ? 'Couleurs' : 'Dégradés'}
                        </button>
                      ))}
                    </div>

                    {bgTab === 'solid' && (
                      <div className="grid grid-cols-10 gap-1.5">
                        {SOLID_COLORS.map(color => (
                          <button key={color} onClick={() => updateSlide(editing.id, { backgroundColor: color, backgroundGradient: undefined, backgroundImage: undefined })}
                            className={cn('w-full aspect-square rounded-md border-2 transition-all',
                              editing.backgroundColor === color && !editing.backgroundGradient && !editing.backgroundImage
                                ? 'border-primary scale-110' : 'border-border/30 hover:border-primary/50'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}

                    {bgTab === 'gradient' && (
                      <div className="grid grid-cols-2 gap-2">
                        {GRADIENT_PRESETS.map(preset => (
                          <button key={preset.label} onClick={() => updateSlide(editing.id, { backgroundGradient: preset.value, backgroundColor: undefined, backgroundImage: undefined })}
                            className={cn('h-12 rounded-lg border-2 transition-all text-xs font-medium text-white/80',
                              editing.backgroundGradient === preset.value ? 'border-primary scale-[1.02]' : 'border-border/30 hover:border-primary/50'
                            )}
                            style={{ background: preset.value }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Image de fond */}
                    <div className="mt-3">
                      <div className="flex gap-2 items-center">
                        <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file'; input.accept = 'image/*';
                            input.onchange = (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (f) handleImageUpload(editing.id, f);
                            };
                            input.click();
                          }}>
                          <Upload className="h-3.5 w-3.5" /> Image de fond
                        </Button>
                        {editing.backgroundImage && (
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive"
                            onClick={() => updateSlide(editing.id, { backgroundImage: undefined })}>
                            Supprimer
                          </Button>
                        )}
                      </div>
                      {editing.backgroundImage && (
                        <div className="mt-2 h-20 rounded-lg overflow-hidden border border-border/40">
                          <img src={editing.backgroundImage} className="w-full h-full object-cover" alt="" />
                        </div>
                      )}
                    </div>

                    {/* Toggle logo d'église */}
                    {loadSettings().churchLogo && (
                      <div className="mt-3">
                        <button
                          onClick={() => updateSlide(editing.id, { showLogo: !editing.showLogo })}
                          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors w-full ${
                            editing.showLogo
                              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                              : 'border-border/40 bg-secondary/40 text-muted-foreground hover:border-border'
                          }`}
                        >
                          <Image className="h-3.5 w-3.5" />
                          Logo d'église {editing.showLogo ? '(affiché)' : '(masqué)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Panel>
      </PanelGroup>
    </div>
  );
}
