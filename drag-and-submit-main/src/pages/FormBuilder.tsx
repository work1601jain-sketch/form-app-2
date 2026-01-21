import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { getFormById, getSubmissions, updateForm, insertSubmission } from '@/integrations/mongodb/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FieldType, FormSubmission } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import FieldPalette from '@/components/form-builder/FieldPalette';
import FormCanvas from '@/components/form-builder/FormCanvas';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2, 
  Layers, 
  ExternalLink,
  FileText,
  BarChart3,
  Copy,
  Check,
  Inbox
} from 'lucide-react';

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [title, setTitle] = useState('Untitled Form');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('build');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'submissions' && id) {
      fetchSubmissions();
    }
  }, [activeTab, id]);

  const fetchForm = async () => {
    const { data, error } = await getFormById(id as string);

    if (error) {
      toast({
        title: 'Error loading form',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } else if (data) {
      setForm(data as unknown as Form);
      setTitle((data as any).title);
      setFields(((data as any).fields as unknown as FormField[]) || []);
    }
    setLoading(false);
  };

  const fetchSubmissions = async () => {
    if (!id) return;
    setLoadingSubmissions(true);
    const { data, error } = await getSubmissions(id as string);

    if (error) {
      toast({
        title: 'Error loading submissions',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSubmissions((data || []).map(s => ({ ...s, data: s.data as Record<string, unknown> })));
    }
    setLoadingSubmissions(false);
  };

  const saveForm = async () => {
    if (!id) return;
    setSaving(true);
    const { data, error } = await updateForm(id as string, {
      title,
      fields: JSON.parse(JSON.stringify(fields)),
    });

    if (error) {
      toast({
        title: 'Error saving form',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Form saved',
        description: 'Your changes have been saved.',
      });
    }
    setSaving(false);
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${id}`);
    setCopied(true);
    toast({
      title: 'Link copied',
      description: 'Form link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const createField = (type: FieldType): FormField => ({
    id: crypto.randomUUID(),
    type,
    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
    placeholder: '',
    required: false,
    options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.data.current?.fromPalette) {
      const fieldType = active.data.current.type as FieldType;
      const newField = createField(fieldType);
      
      if (over.id === 'form-canvas') {
        setFields(prev => [...prev, newField]);
      } else {
        const overIndex = fields.findIndex(f => f.id === over.id);
        if (overIndex !== -1) {
          setFields(prev => {
            const newFields = [...prev];
            newFields.splice(overIndex, 0, newField);
            return newFields;
          });
        } else {
          setFields(prev => [...prev, newField]);
        }
      }
      return;
    }

    if (active.id !== over.id) {
      setFields(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id);
        const newIndex = prev.findIndex(f => f.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
  }, []);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = fields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border/50 bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-64 border-0 bg-transparent text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Form title"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyFormLink}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy Link
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/form/${id}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button size="sm" onClick={saveForm} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border/50 bg-card/50 px-4">
          <TabsList className="h-12 bg-transparent p-0">
            <TabsTrigger 
              value="build" 
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4" />
              Build
            </TabsTrigger>
            <TabsTrigger 
              value="submissions" 
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <BarChart3 className="h-4 w-4" />
              Submissions
              {submissions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {submissions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Build Tab */}
        <TabsContent value="build" className="flex-1 overflow-hidden m-0">
          <div className="flex h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <FieldPalette />
              <FormCanvas
                fields={fields}
                onUpdateField={updateField}
                onDeleteField={deleteField}
                onPreviewSubmit={async () => {
                  if (!id) return;
                  // Build a sample submission from current fields using placeholder or sensible defaults
                  const data: Record<string, unknown> = {};
                  fields.forEach(field => {
                    if (field.type === 'checkbox') {
                      data[field.id] = !!field.required; // if required, set true, else false
                    } else if (field.placeholder && field.placeholder.trim() !== '') {
                      data[field.id] = field.placeholder;
                    } else {
                      // sensible defaults based on type
                      switch (field.type) {
                        case 'email':
                          data[field.id] = 'user@example.com';
                          break;
                        case 'phone':
                          data[field.id] = '+1234567890';
                          break;
                        case 'number':
                          data[field.id] = 42;
                          break;
                        case 'textarea':
                          data[field.id] = 'Sample response';
                          break;
                        case 'select':
                          data[field.id] = field.options?.[0] ?? '';
                          break;
                        default:
                          data[field.id] = field.label || 'Sample';
                      }
                    }
                  });

                  try {
                    const { data: inserted, error } = await insertSubmission(id as string, data);
                    if (error) {
                      toast({ title: 'Preview submit failed', description: error.message, variant: 'destructive' });
                    } else {
                      toast({ title: 'Preview submitted', description: 'A sample response was added to submissions.' });
                      setActiveTab('submissions');
                      fetchSubmissions();
                    }
                  } catch (e: any) {
                    toast({ title: 'Error', description: e?.message || String(e), variant: 'destructive' });
                  }
                }}
              />
            </DndContext>
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="flex-1 overflow-auto m-0 p-6">
          <div className="mx-auto max-w-6xl">
            <Card className="shadow-card">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      Form Submissions
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {submissions.length} response{submissions.length !== 1 ? 's' : ''} collected
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loadingSubmissions}>
                    {loadingSubmissions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSubmissions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <Inbox className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">No submissions yet</h3>
                    <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                      Share your form to start collecting responses
                    </p>
                    <Button variant="outline" onClick={copyFormLink} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Form Link
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[180px] font-semibold">Submitted</TableHead>
                          {fields.map(field => (
                            <TableHead key={field.id} className="font-semibold">{field.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission, index) => (
                          <TableRow 
                            key={submission.id}
                            className="animate-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell className="font-medium text-muted-foreground">
                              {new Date(submission.submitted_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            {fields.map(field => (
                              <TableCell key={field.id}>
                                {formatValue(submission.data[field.id])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
