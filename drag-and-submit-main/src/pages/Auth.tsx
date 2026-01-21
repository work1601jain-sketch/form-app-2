import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  "Drag & drop form builder",
  "Real-time form submissions",
  "Response analytics",
  "Secure data storage"
];

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'You can now sign in with your credentials.',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-foreground p-12 text-primary-foreground lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow-lg">
              <Layers className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-primary-foreground">FormFlow</span>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-primary-foreground">
              Build beautiful forms<br />in minutes
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/70">
              Create, share, and analyze forms with our intuitive drag-and-drop builder.
            </p>
          </div>
          
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-primary-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-primary-foreground/50">
          © 2025 FormFlow. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 gradient-mesh lg:p-12">
        <div className="w-full max-w-md animate-in">
          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <Layers className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">FormFlow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Build beautiful forms in minutes</p>
          </div>

          <Card className="border-0 shadow-xl">
            <Tabs defaultValue="signin" className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="signin" className="text-sm font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-2">
                <TabsContent value="signin" className="mt-0 space-y-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your forms
                    </CardDescription>
                  </div>
                  
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0 space-y-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>
                      Get started with FormFlow today
                    </CardDescription>
                  </div>
                  
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        minLength={6}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters
                      </p>
                    </div>
                    <Button type="submit" className="h-11 w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
          
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
