import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFormById, getSubmissions } from '@/integrations/mongodb/client';
import { Form, FormField, FormSubmission } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Layers, FileText, ExternalLink } from 'lucide-react';

export default function Submissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    // Fetch form
    const { data: formData, error: formError } = await getFormById(id as string);

    if (formError) {
      toast({
        title: 'Error loading form',
        description: formError.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    const parsedForm = {
      ...formData,
      fields: (formData.fields as unknown as FormField[]) || []
    };
    setForm(parsedForm);

    // Fetch submissions
    const { data: submissionsData, error: submissionsError } = await getSubmissions(id as string);

    if (submissionsError) {
      toast({
        title: 'Error loading submissions',
        description: submissionsError.message,
        variant: 'destructive',
      });
    } else {
      setSubmissions((submissionsData || []).map(s => ({ ...s, data: s.data as Record<string, unknown> })));
    }

    setLoading(false);
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = form?.fields.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">{form.title}</h1>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/form/${id}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Form
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate(`/builder/${id}`)}
            >
              Edit Form
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>
              All responses submitted to this form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">No submissions yet</h3>
                <p className="mb-6 text-center text-muted-foreground">
                  Share your form link to start collecting responses
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/form/${id}`);
                    toast({
                      title: 'Link copied',
                      description: 'Form link copied to clipboard',
                    });
                  }}
                >
                  Copy Form Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Submitted</TableHead>
                      {form.fields.map(field => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </TableCell>
                        {form.fields.map(field => (
                          <TableCell key={field.id}>
                            {formatValue(submission.data[field.id])}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/form/${id}`)}>
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/form/${id}?editSubmission=${submission.id}`)}>
                              Edit Response
                            </Button>
                            <Button size="sm" onClick={() => navigate(`/builder/${id}`)}>
                              Edit Form
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}