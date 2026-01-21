import { useDraggable } from '@dnd-kit/core';
import { FieldType } from '@/types/form';
import { 
  Type, 
  Mail, 
  Hash, 
  AlignLeft, 
  List, 
  CheckSquare, 
  Calendar, 
  Phone,
  GripVertical
} from 'lucide-react';

interface FieldOption {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const fieldOptions: FieldOption[] = [
  { type: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" />, description: 'Single line text' },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" />, description: 'Email address' },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, description: 'Numeric value' },
  { type: 'textarea', label: 'Text Area', icon: <AlignLeft className="h-4 w-4" />, description: 'Multi-line text' },
  { type: 'select', label: 'Dropdown', icon: <List className="h-4 w-4" />, description: 'Select from list' },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" />, description: 'Yes/No toggle' },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, description: 'Date picker' },
  { type: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" />, description: 'Phone number' },
];

function DraggableField({ field }: { field: FieldOption }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}`,
    data: { type: field.type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex cursor-grab items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-all duration-200 hover:border-primary/40 hover:bg-accent/50 active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-105 shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        {field.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{field.label}</p>
        <p className="text-xs text-muted-foreground truncate">{field.description}</p>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export default function FieldPalette() {
  return (
    <div className="w-72 flex-shrink-0 border-r border-border/50 bg-muted/30 p-5">
      <div className="mb-5">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          Form Elements
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag fields to add them to your form
        </p>
      </div>
      <div className="space-y-2">
        {fieldOptions.map(field => (
          <DraggableField key={field.type} field={field} />
        ))}
      </div>
    </div>
  );
}
