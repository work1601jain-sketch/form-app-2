import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getForms, getSubmissions } from '@/integrations/mongodb/client';
import { FormSubmission } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';

export default function AllSubmissions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{ formId: string; formTitle: string; submission: FormSubmission }>>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: formsData, error: formsError } = await getForms();
      if (formsError) throw formsError;
      const forms = (formsData || []) as any[];

      // Fetch submissions for all forms in parallel
      const submissionsByForm = await Promise.all(
        forms.map(async (f) => {
          const { data, error } = await getSubmissions(f.id);
          if (error) throw error;
          return { form: f, submissions: (data || []) as FormSubmission[] };
        })
      );

      const aggregated: Array<{ formId: string; formTitle: string; submission: FormSubmission }> = [];
      for (const group of submissionsByForm) {
        for (const s of group.submissions) {
          aggregated.push({ formId: group.form.id, formTitle: group.form.title || 'Untitled', submission: { ...s, data: s.data as Record<string, unknown> } });
        }
      }

      setRows(aggregated.sort((a, b) => (b.submission.submitted_at || '').localeCompare(a.submission.submitted_at || '')));
    } catch (e: any) {
      toast({ title: 'Error loading submissions', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v: unknown) => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">All Submissions</h1>
                <p className="text-xs text-muted-foreground">All stored responses across your forms</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Back</Button>
            <Button size="sm" onClick={() => window.open('/', '_blank')}>Open App</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {rows.length} Submission{rows.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>All responses submitted to all forms</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No submissions found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Form</TableHead>
                      <TableHead className="w-[180px]">Submitted</TableHead>
                      <TableHead>Submission ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={r.submission.id}>
                        <TableCell className="font-medium">{r.formTitle}</TableCell>
                        <TableCell>{new Date(r.submission.submitted_at || '').toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono">{r.submission.id}</TableCell>
                        <TableCell className="max-w-xl truncate">{formatValue(r.submission.data)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/form/${r.formId}`)}>View Form</Button>
                            <Button size="sm" onClick={() => navigate(`/submissions/${r.formId}`)}>View All</Button>
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
