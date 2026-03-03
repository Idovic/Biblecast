/* Éditeur de slides personnalisées */
import { useState } from 'react';
import { Plus, Trash2, Upload, Download, GripVertical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomSlide } from '@/types/bible';

interface SlidesEditorProps {
  slides: CustomSlide[];
  onSlidesChange: (slides: CustomSlide[]) => void;
  onSelectSlide: (slide: CustomSlide) => void;
  onSendSlide: (slide: CustomSlide) => void;
}

const PRESET_COLORS = ['#000000', '#1a1a2e', '#0a1628', '#2a0a14', '#0a1f0f', '#1a1a3e', '#f4a261'];

export default function SlidesEditor({ slides, onSlidesChange, onSelectSlide, onSendSlide }: SlidesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSlide = () => {
    const newSlide: CustomSlide = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      backgroundColor: '#000000',
    };
    onSlidesChange([...slides, newSlide]);
    setEditingId(newSlide.id);
  };

  const updateSlide = (id: string, updates: Partial<CustomSlide>) => {
    onSlidesChange(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    onSlidesChange(slides.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateSlide(id, { backgroundImage: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const exportSlides = () => {
    const json = JSON.stringify(slides, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biblecast-slides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSlides = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) onSlidesChange([...slides, ...imported]);
        } catch { /* ignore */ }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const arr = [...slides];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    onSlidesChange(arr);
  };

  const editing = slides.find(s => s.id === editingId);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button size="sm" onClick={addSlide} className="gap-1">
          <Plus className="h-4 w-4" /> Nouvelle slide
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={importSlides} className="gap-1">
          <Upload className="h-4 w-4" /> Importer
        </Button>
        <Button size="sm" variant="secondary" onClick={exportSlides} disabled={slides.length === 0} className="gap-1">
          <Download className="h-4 w-4" /> Exporter
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Liste des slides */}
        <ScrollArea className="w-1/2 border-r border-border">
          <div className="p-3 space-y-2">
            {slides.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                Aucune slide. Cliquez "Nouvelle slide".
              </p>
            )}
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                onClick={() => { setEditingId(slide.id); onSelectSlide(slide); }}
                className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-2 ${
                  editingId === slide.id ? 'bg-primary/20 border border-primary/40' : 'bg-secondary hover:bg-surface-hover'
                }`}
              >
                <div className="flex flex-col gap-0.5 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>
                    <GripVertical className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{slide.title || 'Sans titre'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{slide.content || '—'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-primary"
                    onClick={(e) => { e.stopPropagation(); onSendSlide(slide); }}>
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Éditeur */}
        <div className="w-1/2 p-4">
          {!editing ? (
            <p className="text-muted-foreground text-sm text-center mt-8">
              Sélectionnez une slide pour l'éditer.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Titre</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => updateSlide(editing.id, { title: e.target.value })}
                  placeholder="Titre de la slide"
                  className="bg-secondary"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Contenu</Label>
                <Textarea
                  value={editing.content}
                  onChange={(e) => updateSlide(editing.id, { content: e.target.value })}
                  placeholder="Texte libre..."
                  className="bg-secondary min-h-[120px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Couleur de fond</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateSlide(editing.id, { backgroundColor: color, backgroundImage: undefined })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        editing.backgroundColor === color && !editing.backgroundImage ? 'border-primary scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Image de fond</Label>
                <Button size="sm" variant="secondary" className="gap-1"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file'; input.accept = 'image/*';
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) handleImageUpload(editing.id, f);
                    };
                    input.click();
                  }}>
                  <Upload className="h-4 w-4" /> Choisir une image
                </Button>
                {editing.backgroundImage && (
                  <Button size="sm" variant="ghost" className="ml-2 text-destructive"
                    onClick={() => updateSlide(editing.id, { backgroundImage: undefined })}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
