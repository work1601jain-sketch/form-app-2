import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GripVertical, 
  Trash2, 
  Type, 
  Mail, 
  Hash, 
  AlignLeft, 
  List, 
  CheckSquare, 
  Calendar, 
  Phone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface SortableFieldProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onDelete: (id: string) => void;
}

const fieldIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
};

const fieldLabels: Record<FieldType, string> = {
  text: 'Text Input',
  email: 'Email',
  number: 'Number',
  textarea: 'Text Area',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  date: 'Date',
  phone: 'Phone',
};

export default function SortableField({ field, onUpdate, onDelete }: SortableFieldProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-card transition-all duration-200 ${
        isDragging 
          ? 'shadow-xl ring-2 ring-primary scale-[1.02] z-50' 
          : 'shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {fieldIcons[field.type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{field.label || 'Untitled Field'}</p>
          <p className="text-xs text-muted-foreground">{fieldLabels[field.type]}</p>
        </div>

        <div className="flex items-center gap-1">
          {field.required && (
            <span className="badge-primary text-[10px]">Required</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-in-scale">
          {/* Label Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Field Label</Label>
            <Input
              value={field.label}
              onChange={e => onUpdate(field.id, { label: e.target.value })}
              placeholder="Enter field label"
              className="h-10"
            />
          </div>

          {/* Placeholder Input */}
          {field.type !== 'checkbox' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Placeholder</Label>
              <Input
                value={field.placeholder || ''}
                onChange={e => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
                className="h-10"
              />
            </div>
          )}

          {/* Options for Select */}
          {field.type === 'select' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Options <span className="text-muted-foreground/60">(comma separated)</span>
              </Label>
              <Input
                value={field.options?.join(', ') || ''}
                onChange={e => 
                  onUpdate(field.id, { 
                    options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) 
                  })
                }
                placeholder="Option 1, Option 2, Option 3"
                className="h-10"
              />
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked: boolean) => onUpdate(field.id, { required: checked })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-sm cursor-pointer">
              Make this field required
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
