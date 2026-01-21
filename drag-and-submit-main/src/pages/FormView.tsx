import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getFormById, insertSubmission, getSubmissionById, updateSubmission } from '@/integrations/mongodb/client';
import { Form, FormField } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Layers, Send, AlertCircle } from 'lucide-react';
import { z } from 'zod';

export default function FormView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  useEffect(() => {
    const editId = searchParams.get('editSubmission');
    if (editId) setEditingSubmissionId(editId);
  }, [searchParams]);

  const fetchForm = async () => {
    const { data, error } = await getFormById(id as string);

    if (error) {
      toast({
        title: 'Form not found',
        description: 'This form may have been deleted.',
        variant: 'destructive',
      });
    } else if (data) {
      const parsedForm = {
        ...data,
        fields: (data.fields as unknown as FormField[]) || []
      };
      setForm(parsedForm);
      
      const initialData: Record<string, unknown> = {};
      parsedForm.fields.forEach((field: FormField) => {
        initialData[field.id] = field.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);
    }
    setLoading(false);
  };

  useEffect(() => {
    // If editing a submission, fetch it after the form has loaded
    if (!loading && editingSubmissionId && id) {
      (async () => {
        const { data, error } = await getSubmissionById(id, editingSubmissionId);
        if (error) {
          toast({ title: 'Error loading submission', description: error.message, variant: 'destructive' });
          return;
        }
        if (data) {
          // data.data contains the answers
          const answers = (data as any).data || {};
          // Map answers into formData shape
          const newFormData: Record<string, unknown> = {};
          (form?.fields || []).forEach((field: FormField) => {
            newFormData[field.id] = answers[field.id] ?? (field.type === 'checkbox' ? false : '');
          });
          setFormData(newFormData);
        }
      })();
    }
  }, [loading, editingSubmissionId, id]);

  const validateForm = (): boolean => {
    if (!form) return false;
    
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required) {
        if (field.type === 'checkbox') {
          if (value !== true) {
            newErrors[field.id] = 'This field is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = 'This field is required';
        }
      }

      if (field.type === 'email' && value && typeof value === 'string') {
        const emailSchema = z.string().email();
        const result = emailSchema.safeParse(value.trim());
        if (!result.success) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      if (field.type === 'phone' && value && typeof value === 'string') {
        const phoneValue = value.trim();
        if (phoneValue && !/^[\d\s\-+()]+$/.test(phoneValue)) {
          newErrors[field.id] = 'Please enter a valid phone number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!validateForm()) {
      toast({
        title: 'Please fix the errors',
        description: 'Some fields have validation errors.',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);

    // Sanitize form data before submission
    const sanitizedData: Record<string, unknown> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sanitizedData[key] = value.trim().slice(0, 10000); // Limit string length
      } else {
        sanitizedData[key] = value;
      }
    });

    if (editingSubmissionId) {
      // update existing submission
      const payload = { ...sanitizedData, submitted_at: new Date().toISOString() };
      const { data: updated, error } = await updateSubmission(id as string, editingSubmissionId, payload);
      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Submission updated', description: 'The response was updated.' });
        setSubmitted(true);
      }
    } else {
      const { data: inserted, error } = await insertSubmission(id as string, JSON.parse(JSON.stringify(sanitizedData)));

      if (error) {
        toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
      } else {
        setSubmitted(true);
      }
    }
    setSubmitting(false);
  };

  const updateField = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value as string}
            onChange={e => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            maxLength={500}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={e => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={e => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
            maxLength={5000}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={val => updateField(field.id, val)}
          >
            <SelectTrigger className={`h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-3">
            <Checkbox
              id={field.id}
              checked={value as boolean}
              onCheckedChange={(checked: boolean) => updateField(field.id, checked)}
              className={error ? 'border-destructive' : ''}
            />
            <Label htmlFor={field.id} className="cursor-pointer text-sm">
              {field.placeholder || 'I agree'}
            </Label>
          </div>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={e => updateField(field.id, e.target.value)}
            className={`h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-semibold">Form not found</h2>
            <p className="mt-2 text-center text-muted-foreground">
              This form may have been deleted or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit-mode banner shown when editing a specific submission
  const EditBanner = () => (
    <div className="w-full bg-yellow-50 border-y border-yellow-200 p-3 mb-4 rounded">
      <div className="container flex items-center justify-between">
        <div className="text-sm text-yellow-800">You are editing a response (id: {editingSubmissionId})</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-white border"
            onClick={() => {
              // remove editSubmission param
              const params = new URLSearchParams(Array.from(searchParams.entries()));
              params.delete('editSubmission');
              navigate({ pathname: `/form/${id}`, search: params.toString() });
              setEditingSubmissionId(null);
            }}
          >
            Cancel Edit
          </button>
          <button className="px-3 py-1 rounded bg-white border" onClick={() => navigate(`/submissions/${id}`)}>
            Back to Submissions
          </button>
          <button className="px-3 py-1 rounded bg-primary text-white" onClick={() => navigate(`/builder/${id}`)}>
            Edit Form
          </button>
        </div>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-4">
        <Card className="w-full max-w-md animate-in-scale border-0 shadow-xl">
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="font-display text-2xl font-bold">Thank you!</h2>
            <p className="mt-2 text-center text-muted-foreground">
              Your response has been submitted successfully.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setSubmitted(false);
                // Reset form data
                const initialData: Record<string, unknown> = {};
                form.fields.forEach((field: FormField) => {
                  initialData[field.id] = field.type === 'checkbox' ? false : '';
                });
                setFormData(initialData);
              }}
            >
              Submit another response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-4 py-12">
      <Card className="w-full max-w-lg animate-in border-0 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">{form.title}</CardTitle>
          {form.description && (
            <CardDescription className="mt-2">{form.description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {form.fields.map(field => (
              <div key={field.id} className="space-y-2">
                {field.type !== 'checkbox' && (
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                )}
                {renderField(field)}
                {errors[field.id] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.id]}
                  </p>
                )}
              </div>
            ))}
            
            <Button type="submit" className="h-11 w-full gap-2 mt-6" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
