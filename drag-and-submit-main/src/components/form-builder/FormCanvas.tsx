import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FormField } from '@/types/form';
import SortableField from './SortableField';
import { FileText, MousePointer2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormCanvasProps {
  fields: FormField[];
  onUpdateField: (id: string, updates: Partial<FormField>) => void;
  onDeleteField: (id: string) => void;
  onPreviewSubmit?: () => Promise<void>;
}

export default function FormCanvas({ fields, onUpdateField, onDeleteField, onPreviewSubmit }: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-auto bg-muted/20 p-8 transition-colors scrollbar-thin ${
        isOver ? 'bg-accent/20' : ''
      }`}
    >
      <div className="mx-auto max-w-2xl">
        {fields.length === 0 ? (
          <div 
            className={`flex min-h-[450px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
              isOver 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-muted-foreground/20 bg-card/50'
            }`}
          >
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
              isOver ? 'bg-primary/10' : 'bg-muted'
            }`}>
              {isOver ? (
                <MousePointer2 className="h-8 w-8 text-primary" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">
              {isOver ? 'Drop to add field' : 'Start building your form'}
            </h3>
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              {isOver 
                ? 'Release to add this field to your form'
                : 'Drag fields from the left panel and drop them here to build your form'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="animate-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <SortableField
                      field={field}
                      onUpdate={onUpdateField}
                      onDelete={onDeleteField}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
            
            {/* Submit Button Preview */}
            <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Form Submit Button</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">This button will appear at the end of your form</p>
                </div>
                <Button onClick={async () => { if (onPreviewSubmit) await onPreviewSubmit(); }} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Drop zone at bottom */}
            <div 
              className={`flex h-16 items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                isOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-transparent hover:border-muted-foreground/20'
              }`}
            >
              {isOver && (
                <p className="text-sm text-primary font-medium">Drop here to add at the end</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
