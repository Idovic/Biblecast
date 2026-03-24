/* Éditeur de diapositives — genId() compatible Android + templates prédéfinis */
import { useState, useRef } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Edit3, Image as ImageIcon,
  Download, Upload, AlignLeft, AlignCenter, AlignRight, Maximize2, X,
  LayoutTemplate, CheckCircle2, Send, Copy,
  HandHeart, Megaphone, BookOpen, Music2, Mic2, Users, Gift,
  FileText, List, Frame, Presentation, Church, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, genId } from '@/lib/utils';
import type { CustomSlide, SlideType } from '@/types/bible';

interface SlidesEditorProps {
  slides: CustomSlide[];
  onChange: (slides: CustomSlide[]) => void;
  onProjectSlide?: (slide: CustomSlide) => void;
  currentProjectedSlide?: CustomSlide | null;
  onEditingSlide?: (slide: CustomSlide | null) => void;
}

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  'text-title': 'Titre + Texte',
  'title-only': 'Titre seul',
  'verse-title': 'Verset + Titre',
  'blank': 'Vide',
  'bullet-list': 'Liste à puces',
  'image-full': 'Visuel (Image)',
};

const SLIDE_TYPE_ICON_COMPONENTS: Record<SlideType, React.ReactNode> = {
  'text-title': <FileText className="h-3 w-3" />,
  'title-only': <Presentation className="h-3 w-3" />,
  'verse-title': <BookOpen className="h-3 w-3" />,
  'blank': <Frame className="h-3 w-3" />,
  'bullet-list': <List className="h-3 w-3" />,
  'image-full': <ImageIcon className="h-3 w-3" />,
};

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Petit', desc: 'S' },
  { value: 'medium', label: 'Moyen', desc: 'M' },
  { value: 'large', label: 'Grand', desc: 'L' },
  { value: 'xlarge', label: 'Très grand', desc: 'XL' },
] as const;

export const GRADIENT_PRESETS = [
  { label: 'Nuit', value: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' },
  { label: 'Violet', value: 'linear-gradient(135deg,#2d1b69,#11998e)' },
  { label: 'Bleu', value: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' },
  { label: 'Bordeaux', value: 'linear-gradient(135deg,#360033,#0b8793)' },
  { label: 'Forêt', value: 'linear-gradient(135deg,#134e5e,#71b280)' },
  { label: 'Aube', value: 'linear-gradient(135deg,#373b44,#4286f4)' },
  { label: 'Or', value: 'linear-gradient(135deg,#c79231,#3b2a00)' },
  { label: 'Ébène', value: 'linear-gradient(135deg,#232526,#414345)' },
  { label: 'Grenat', value: 'linear-gradient(135deg,#4b0010,#1f003a)' },
];

const TEXT_COLORS = ['#ffffff', '#f5f5dc', '#ffd700', '#87ceeb', '#98fb98', '#ffa07a', '#e0b0ff'];

interface SlideTemplate {
  id: string;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  description: string;
  slide: Omit<CustomSlide, 'id'>;
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'bienvenue',
    name: 'Bienvenue',
    Icon: Church,
    iconColor: '#93c5fd',
    description: 'Accueil des fidèles',
    slide: {
      title: 'Bienvenue !',
      content: '',
      slideType: 'title-only',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
      fontSize: 'xlarge',
      textAlign: 'center',
      textShadow: true,
      showLogo: true,
    },
  },
  {
    id: 'priere',
    name: "Prière d'intercession",
    Icon: HandHeart,
    iconColor: '#f9a8d4',
    description: 'Prière collective',
    slide: {
      title: "Prière d'intercession",
      content: '« La prière fervente du juste a une grande efficace. »\n— Jacques 5:16',
      slideType: 'text-title',
      textColor: '#f5f5dc',
      backgroundGradient: 'linear-gradient(135deg,#360033,#0b8793)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'ecole',
    name: 'École du dimanche',
    Icon: BookOpen,
    iconColor: '#86efac',
    description: 'Thème + verset',
    slide: {
      title: 'École du dimanche',
      content: 'Thème : \nVerset : ',
      slideType: 'text-title',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#134e5e,#71b280)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: false,
      showLogo: false,
    },
  },
  {
    id: 'annonce',
    name: 'Annonces',
    Icon: Megaphone,
    iconColor: '#fbbf24',
    description: "Informations de l'assemblée",
    slide: {
      title: 'Annonces',
      content: '',
      slideType: 'text-title',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#373b44,#4286f4)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: false,
      showLogo: false,
    },
  },
  {
    id: 'dimes',
    name: 'Dîmes & Offrandes',
    Icon: Gift,
    iconColor: '#fcd34d',
    description: 'Collecte avec verset',
    slide: {
      title: 'Dîmes & Offrandes',
      content: '« Apportez à la maison du trésor toutes les dîmes… »\n— Malachie 3:10',
      slideType: 'text-title',
      textColor: '#ffd700',
      backgroundGradient: 'linear-gradient(135deg,#c79231,#3b2a00)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'temoignages',
    name: 'Témoignages',
    Icon: Mic2,
    iconColor: '#c4b5fd',
    description: 'Partage de témoignages',
    slide: {
      title: 'Témoignages',
      content: '',
      slideType: 'title-only',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#4b0010,#1f003a)',
      fontSize: 'xlarge',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'louange',
    name: 'Louange & Adoration',
    Icon: Music2,
    iconColor: '#e0b0ff',
    description: 'Temps de louange',
    slide: {
      title: 'Louange & Adoration',
      content: '',
      slideType: 'title-only',
      textColor: '#e0b0ff',
      backgroundGradient: 'linear-gradient(135deg,#2d1b69,#11998e)',
      fontSize: 'xlarge',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'chorale',
    name: 'Prestation de la Chorale',
    Icon: Users,
    iconColor: '#6ee7b7',
    description: 'Concert choral',
    slide: {
      title: 'Prestation de la Chorale',
      content: '',
      slideType: 'title-only',
      textColor: '#98fb98',
      backgroundGradient: 'linear-gradient(135deg,#134e5e,#71b280)',
      fontSize: 'xlarge',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'predication',
    name: 'Prédication',
    Icon: Sparkles,
    iconColor: '#fde68a',
    description: 'Thème + verset référence',
    slide: {
      title: 'Prédication',
      content: 'Thème : \nVerset : ',
      slideType: 'text-title',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: true,
      showLogo: true,
    },
  },
  {
    id: 'verset',
    name: 'Verset simple',
    Icon: BookOpen,
    iconColor: '#f5f5dc',
    description: 'Citation biblique',
    slide: {
      title: 'Livre chapitre:verset',
      content: '« Saisissez le texte du verset ici »',
      slideType: 'verse-title',
      textColor: '#f5f5dc',
      backgroundGradient: 'linear-gradient(135deg,#232526,#414345)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: true,
      showLogo: false,
    },
  },
  {
    id: 'liste',
    name: 'Liste à puces',
    Icon: List,
    iconColor: '#93c5fd',
    description: 'Points clés, programme',
    slide: {
      title: 'Programme du culte',
      content: '',
      bullets: ['Premier point', 'Deuxième point', 'Troisième point'],
      slideType: 'bullet-list',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
      fontSize: 'large',
      textAlign: 'left',
      textShadow: false,
      showLogo: false,
    },
  },
  {
    id: 'visuel',
    name: 'Visuel / Image',
    Icon: ImageIcon,
    iconColor: '#f9a8d4',
    description: 'Affiche, invitation, flyer',
    slide: {
      title: '',
      content: '',
      slideType: 'image-full',
      textColor: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg,#232526,#414345)',
      fontSize: 'large',
      textAlign: 'center',
      textShadow: false,
      showLogo: false,
    },
  },
];

function makeSlide(template: SlideTemplate): CustomSlide {
  return { id: genId(), ...template.slide };
}

function createSlide(type: SlideType): CustomSlide {
  return {
    id: genId(),
    title: type === 'image-full' ? '' : 'Nouveau titre',
    content: '',
    slideType: type,
    textColor: '#ffffff',
    backgroundGradient: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    fontSize: 'large',
    textAlign: 'center',
    textShadow: false,
    showLogo: false,
  };
}

function SlideThumbnail({ slide }: { slide: CustomSlide }) {
  const bg = slide.backgroundImage ? `url(${slide.backgroundImage})` : (slide.backgroundGradient ?? slide.backgroundColor ?? '#1a1a2e');
  return (
    <div
      className="h-20 w-full rounded-lg overflow-hidden relative flex items-center justify-center shrink-0"
      style={{
        background: bg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: slide.textColor ?? '#fff',
      }}
    >
      {slide.slideType === 'image-full' && slide.backgroundImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-white/60" />
        </div>
      )}
      {slide.slideType !== 'image-full' && (
        <div className="px-2 text-center">
          {slide.title && <p className="text-[9px] font-bold leading-tight line-clamp-1">{slide.title}</p>}
          {slide.content && <p className="text-[8px] mt-0.5 line-clamp-2 opacity-80 leading-tight">{slide.content}</p>}
          {slide.bullets && slide.bullets.length > 0 && <p className="text-[8px] mt-0.5 opacity-80 leading-tight">• {slide.bullets[0]}</p>}
        </div>
      )}
      {slide.slideType === 'blank' && <span className="text-[10px] text-white/40">Vide</span>}
    </div>
  );
}

function TemplateThumbnail({ template }: { template: SlideTemplate }) {
  const bg = (template.slide as CustomSlide).backgroundGradient ?? '#1a1a2e';
  const { Icon, iconColor } = template;
  return (
    <div
      className="h-16 w-full rounded-lg overflow-hidden flex items-center justify-center"
      style={{ background: bg }}
    >
      <div className="text-center px-2">
        <div className="flex justify-center mb-1">
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <p className="text-[8px] font-bold opacity-90 leading-tight line-clamp-2" style={{ color: (template.slide as CustomSlide).textColor ?? '#fff' }}>
          {template.name}
        </p>
      </div>
    </div>
  );
}

export default function SlidesEditor({ slides, onChange, onProjectSlide, currentProjectedSlide, onEditingSlide }: SlidesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedEdit, setExpandedEdit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEditing = (id: string | null) => {
    setEditingId(id);
    setExpandedEdit(false);
    if (id === null) {
      onEditingSlide?.(null);
    } else {
      const slide = slides.find(s => s.id === id) ?? null;
      onEditingSlide?.(slide);
    }
  };

  const addSlide = (type: SlideType) => {
    const slide = createSlide(type);
    if (type === 'image-full') {
      handleImageUploadForSlide(slide, (s) => {
        onChange([...slides, s]);
        setEditingId(s.id);
        onEditingSlide?.(s);
      });
      return;
    }
    onChange([...slides, slide]);
    setEditingId(slide.id);
    onEditingSlide?.(slide);
    setExpandedEdit(false);
  };

  const addFromTemplate = (template: SlideTemplate) => {
    if (template.slide.slideType === 'image-full') {
      const slide = makeSlide(template);
      handleImageUploadForSlide(slide, (s) => {
        onChange([...slides, s]);
        setEditingId(s.id);
        onEditingSlide?.(s);
      });
      setShowTemplates(false);
      return;
    }
    const slide = makeSlide(template);
    onChange([...slides, slide]);
    setEditingId(slide.id);
    onEditingSlide?.(slide);
    setExpandedEdit(false);
    setShowTemplates(false);
  };

  const updateSlide = (id: string, patch: Partial<CustomSlide>) => {
    const updated = slides.map(s => s.id === id ? { ...s, ...patch } : s);
    onChange(updated);
    if (id === editingId) {
      const updatedSlide = updated.find(s => s.id === id) ?? null;
      onEditingSlide?.(updatedSlide);
    }
  };

  const duplicateSlide = (id: string) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const clone: CustomSlide = { ...slides[idx], id: genId() };
    const arr = [...slides];
    arr.splice(idx + 1, 0, clone);
    onChange(arr);
  };

  const removeSlide = (id: string) => {
    onChange(slides.filter(s => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      onEditingSlide?.(null);
    }
  };

  const moveSlide = (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  function handleImageUploadForSlide(slide: CustomSlide, onDone: (s: CustomSlide) => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { onDone(slide); return; }
      if (file.size > 8 * 1024 * 1024) {
        alert("Image trop grande (max 8 Mo). Compressez-la d'abord.");
        onDone(slide);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => onDone({ ...slide, backgroundImage: ev.target?.result as string });
      reader.readAsDataURL(file);
    };
    input.click();
  }

  const handleImageUpload = (id: string) => {
    const slide = slides.find(s => s.id === id);
    if (!slide) return;
    handleImageUploadForSlide(slide, (updated) => updateSlide(id, { backgroundImage: updated.backgroundImage }));
  };

  const handleImportVisual = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) { alert('Image trop grande (max 8 Mo).'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const slide = createSlide('image-full');
        slide.backgroundImage = ev.target?.result as string;
        slide.title = file.name.replace(/\.[^/.]+$/, '');
        onChange([...slides, slide]);
        onProjectSlide?.(slide);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleExport = () => {
    const slidesNoImg = slides.map(s => ({ ...s, backgroundImage: undefined }));
    const json = JSON.stringify(slidesNoImg, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biblecast-slides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as CustomSlide[];
        if (Array.isArray(data)) {
          onChange([...slides, ...data.map(s => ({ ...s, id: genId() }))]);
        }
      } catch { alert('Fichier JSON invalide.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Modal Templates */}
      {showTemplates && (
        <div className="absolute inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-sm rounded-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Templates de diapositives</span>
            </div>
            <button onClick={() => setShowTemplates(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 content-start">
            {SLIDE_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => addFromTemplate(tpl)}
                className="flex flex-col rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/30 overflow-hidden transition-smooth text-left"
              >
                <TemplateThumbnail template={tpl} />
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold text-foreground leading-tight">{tpl.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="shrink-0 px-2 pt-2 pb-1 space-y-2">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/30 text-xs text-primary font-medium transition-smooth"
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </button>
          <button onClick={() => addSlide('text-title')}
            className="flex-1 min-w-[72px] flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-border/50 bg-secondary/30 hover:bg-secondary/70 text-xs text-muted-foreground hover:text-foreground transition-smooth">
            <Plus className="h-3.5 w-3.5" /> Titre+Texte
          </button>
          <button onClick={() => addSlide('bullet-list')}
            className="flex-1 min-w-[72px] flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-border/50 bg-secondary/30 hover:bg-secondary/70 text-xs text-muted-foreground hover:text-foreground transition-smooth">
            <Plus className="h-3.5 w-3.5" /> Liste
          </button>
          <button onClick={handleImportVisual}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-xs text-amber-400 hover:text-amber-300 transition-smooth">
            <ImageIcon className="h-3.5 w-3.5" /> Visuel
          </button>
        </div>
        {slides.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground">{slides.length} diapositive{slides.length > 1 ? 's' : ''}</span>
            <div className="flex gap-1">
              <button onClick={handleExport} title="Exporter les slides (JSON)"
                className="h-6 w-6 rounded border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth">
                <Download className="h-3 w-3" />
              </button>
              <label title="Importer des slides (JSON)" className="h-6 w-6 rounded border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth cursor-pointer">
                <Upload className="h-3 w-3" />
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Liste des slides */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        {slides.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3 px-4">
            <LayoutTemplate className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Aucune diapositive</p>
            <p className="text-xs text-muted-foreground/50">Utilisez les Templates ou les boutons ci-dessus</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-sm text-primary font-medium transition-smooth"
            >
              <LayoutTemplate className="h-4 w-4" />
              Choisir un template
            </button>
          </div>
        )}

        {slides.map((slide, idx) => {
          const isEditing = editingId === slide.id;
          const isProjected = currentProjectedSlide?.id === slide.id;
          return (
            <div key={slide.id}
              className={cn('rounded-xl border transition-all overflow-hidden',
                isEditing ? 'border-primary/40 bg-primary/5' : isProjected ? 'border-green-500/30 bg-green-500/5' : 'border-border/40 bg-secondary/30'
              )}>
              {/* Thumbnail + actions rapides */}
              <div className="p-2">
                <SlideThumbnail slide={slide} />
                <div className="flex items-center gap-1 mt-2">
                  {isProjected && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                  <span className="text-[10px] text-muted-foreground flex-1 truncate font-medium flex items-center gap-1">
                    <span className="text-muted-foreground/60">{SLIDE_TYPE_ICON_COMPONENTS[slide.slideType]}</span>
                    {slide.title || SLIDE_TYPE_LABELS[slide.slideType]}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0}
                      className="h-6 w-6 rounded border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-smooth">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveSlide(slide.id, 1)} disabled={idx === slides.length - 1}
                      className="h-6 w-6 rounded border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-smooth">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {onProjectSlide && (
                      <button onClick={() => onProjectSlide(slide)} title="Projeter sur l'écran"
                        className={cn('h-6 w-6 rounded border flex items-center justify-center transition-smooth',
                          isProjected ? 'border-green-500/50 bg-green-500/20 text-green-400' : 'border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30'
                        )}>
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => duplicateSlide(slide.id)} title="Dupliquer"
                      className="h-6 w-6 rounded border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth">
                      <Copy className="h-3 w-3" />
                    </button>
                    <button onClick={() => openEditing(isEditing ? null : slide.id)}
                      className={cn('h-6 w-6 rounded border flex items-center justify-center transition-smooth',
                        isEditing ? 'border-primary/50 bg-primary/20 text-primary' : 'border-border/30 text-muted-foreground hover:text-foreground'
                      )}>
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeSlide(slide.id)}
                      className="h-6 w-6 rounded border border-border/30 flex items-center justify-center text-muted-foreground hover:text-destructive transition-smooth">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Panneau d'édition inline */}
              {isEditing && (
                <div className="border-t border-border/40 p-3 space-y-3">
                  {/* Type de slide */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</Label>
                    <div className="flex gap-1 flex-wrap">
                      {(Object.keys(SLIDE_TYPE_LABELS) as SlideType[]).map(t => (
                        <button key={t} onClick={() => updateSlide(slide.id, { slideType: t })}
                          className={cn('px-2 py-1 rounded-lg border text-[10px] transition-smooth flex items-center gap-1',
                            slide.slideType === t ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                          )}>
                          <span className="opacity-70">{SLIDE_TYPE_ICON_COMPONENTS[t]}</span>
                          {SLIDE_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {slide.slideType !== 'image-full' && (
                    <>
                      {/* Titre */}
                      {slide.slideType !== 'verse-title' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Titre</Label>
                          <Input value={slide.title} onChange={e => updateSlide(slide.id, { title: e.target.value })}
                            placeholder="Titre de la diapositive" className="h-8 text-sm bg-secondary border-border/50" />
                        </div>
                      )}

                      {/* Taille du titre */}
                      {slide.slideType !== 'title-only' && slide.slideType !== 'verse-title' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Taille du titre</Label>
                          <div className="flex gap-1">
                            {FONT_SIZE_OPTIONS.map(opt => (
                              <button key={opt.value}
                                onClick={() => updateSlide(slide.id, { titleFontSize: opt.value })}
                                className={cn('flex-1 py-1.5 rounded-lg border text-[10px] font-medium transition-smooth',
                                  (slide.titleFontSize ?? 'medium') === opt.value ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                                )}>
                                {opt.desc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {['text-title', 'verse-title', 'blank'].includes(slide.slideType) && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Contenu</Label>
                            <button onClick={() => setExpandedEdit(!expandedEdit)}
                              title={expandedEdit ? 'Réduire' : "Agrandir l'éditeur"}
                              className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth rounded">
                              {expandedEdit ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <textarea
                            value={slide.content}
                            onChange={e => updateSlide(slide.id, { content: e.target.value })}
                            placeholder="Saisissez le contenu…"
                            className={cn(
                              'w-full rounded-lg border border-border/50 bg-secondary text-sm px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-smooth',
                              expandedEdit ? 'min-h-[200px]' : 'min-h-[100px]'
                            )}
                            style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
                          />
                          <p className="text-[9px] text-muted-foreground/40 text-right">{(slide.content || '').length} car.</p>
                        </div>
                      )}

                      {slide.slideType === 'bullet-list' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Points (un par ligne)</Label>
                          <textarea
                            value={(slide.bullets ?? []).join('\n')}
                            onChange={e => updateSlide(slide.id, { bullets: e.target.value.split('\n') })}
                            placeholder={"Premier point\nDeuxième point\nTroisième point"}
                            className="w-full min-h-[100px] rounded-lg border border-border/50 bg-secondary text-sm px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-smooth"
                            style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
                          />
                        </div>
                      )}

                      {/* Taille du texte */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Taille du texte</Label>
                        <div className="flex gap-1">
                          {FONT_SIZE_OPTIONS.map(opt => (
                            <button key={opt.value}
                              onClick={() => updateSlide(slide.id, { fontSize: opt.value })}
                              className={cn('flex-1 py-1.5 rounded-lg border text-[10px] font-medium transition-smooth',
                                slide.fontSize === opt.value ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                              )}>
                              {opt.desc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Alignement */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Alignement</Label>
                        <div className="flex gap-1">
                          {([
                            { v: 'left', icon: <AlignLeft className="h-3.5 w-3.5" /> },
                            { v: 'center', icon: <AlignCenter className="h-3.5 w-3.5" /> },
                            { v: 'right', icon: <AlignRight className="h-3.5 w-3.5" /> },
                          ] as const).map(({ v, icon }) => (
                            <button key={v} onClick={() => updateSlide(slide.id, { textAlign: v })}
                              className={cn('flex-1 h-8 rounded-lg border flex items-center justify-center transition-smooth',
                                slide.textAlign === v ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                              )}>
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fond */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {slide.slideType === 'image-full' ? 'Image' : 'Fond'}
                    </Label>
                    <div className="flex gap-1 flex-wrap">
                      {slide.slideType !== 'image-full' && GRADIENT_PRESETS.map(g => (
                        <button key={g.value}
                          onClick={() => updateSlide(slide.id, { backgroundGradient: g.value, backgroundImage: undefined })}
                          title={g.label}
                          className={cn('h-7 w-7 rounded-lg border transition-smooth',
                            slide.backgroundGradient === g.value ? 'border-primary/80 ring-1 ring-primary' : 'border-border/30 hover:border-white/50'
                          )}
                          style={{ background: g.value }}
                        />
                      ))}
                      <button onClick={() => handleImageUpload(slide.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] text-muted-foreground hover:text-foreground transition-smooth',
                          slide.backgroundImage ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-border/40 bg-secondary/40'
                        )}>
                        <ImageIcon className="h-3.5 w-3.5" />
                        {slide.backgroundImage ? 'Changer' : 'Image'}
                      </button>
                      {slide.backgroundImage && (
                        <button onClick={() => updateSlide(slide.id, { backgroundImage: undefined })}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/40 bg-secondary/40 text-[10px] text-destructive/80 hover:text-destructive transition-smooth">
                          <X className="h-3 w-3" /> Retirer
                        </button>
                      )}
                    </div>
                  </div>

                  {slide.slideType !== 'image-full' && (
                    <>
                      {/* Couleur du texte */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Couleur du texte</Label>
                        <div className="flex gap-1.5 items-center flex-wrap">
                          {TEXT_COLORS.map(c => (
                            <button key={c}
                              onClick={() => updateSlide(slide.id, { textColor: c })}
                              className={cn('h-6 w-6 rounded-full border transition-smooth',
                                slide.textColor === c ? 'border-2 border-white scale-110' : 'border-border/30 hover:scale-105'
                              )}
                              style={{ background: c }}
                            />
                          ))}
                          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                            <input type="color" value={slide.textColor ?? '#ffffff'}
                              onChange={e => updateSlide(slide.id, { textColor: e.target.value })}
                              className="h-6 w-6 rounded border border-border/30 cursor-pointer bg-transparent" />
                            Autre
                          </label>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => updateSlide(slide.id, { textShadow: !slide.textShadow })}
                          className={cn('px-2 py-1 rounded-lg border text-[10px] transition-smooth',
                            slide.textShadow ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                          )}>
                          Ombre texte
                        </button>
                        <button onClick={() => updateSlide(slide.id, { showLogo: !slide.showLogo })}
                          className={cn('px-2 py-1 rounded-lg border text-[10px] transition-smooth',
                            slide.showLogo ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground'
                          )}>
                          Logo église
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
