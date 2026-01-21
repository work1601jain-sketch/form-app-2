import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getForms as getFormsApi, createForm as createFormApi, deleteFormById } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField } from '@/types/form';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Eye, 
  LogOut, 
  Layers, 
  Loader2,
  MoreHorizontal,
  Edit3,
  BarChart3,
  Calendar,
  ExternalLink
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const { data, error } = await getFormsApi();

    if (error) {
      toast({
        title: 'Error loading forms',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const parsedForms = (data || []).map((form: any) => ({
        ...form,
        fields: (form.fields as unknown as FormField[]) || []
      }));
      setForms(parsedForms);
    }
    setLoading(false);
  };

  const createNewForm = async () => {
    const { data, error } = await createFormApi(user?.id);

    if (error) {
      toast({
        title: 'Error creating form',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      navigate(`/builder/${data.id}`);
    }
  };

  const deleteForm = async (formId: string) => {
    const { data, error } = await deleteFormById(formId);

    if (error) {
      toast({
        title: 'Error deleting form',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setForms(forms.filter(f => f.id !== formId));
      toast({
        title: 'Form deleted',
        description: 'The form has been permanently deleted.',
      });
    }
    setDeleteFormId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="header-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">FormFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Your Forms</h1>
              <p className="mt-1 text-muted-foreground">
                Create, manage, and track your form submissions
              </p>
            </div>
            <Button onClick={createNewForm} className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Create Form
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {!loading && forms.length > 0 && (
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="stat-value">{forms.length}</p>
                  <p className="stat-label">Total Forms</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="stat-value text-emerald-600">Active</p>
                  <p className="stat-label">Form Status</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="stat-value text-amber-600">
                    {forms.length > 0 ? formatDate(forms[0].updated_at) : '-'}
                  </p>
                  <p className="stat-label">Last Updated</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading your forms...</p>
            </div>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold">No forms yet</h3>
            <p className="mb-8 max-w-sm text-center text-muted-foreground">
              Get started by creating your first form. Drag and drop fields to build beautiful forms in minutes.
            </p>
            <Button onClick={createNewForm} className="gap-2" size="lg">
              <Plus className="h-5 w-5" />
              Create Your First Form
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form, index) => (
              <Card 
                key={form.id} 
                className="group card-interactive overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base font-semibold">
                          {form.title}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                          {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/builder/${form.id}`)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/submissions/${form.id}`)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/form/${form.id}`, '_blank')}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Form
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteFormId(form.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4 text-xs text-muted-foreground">
                    Updated {formatDate(form.updated_at)}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/builder/${form.id}`)}
                    >
                      <Edit3 className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/submissions/${form.id}`)}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Responses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the form and all its submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFormId && deleteForm(deleteFormId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
