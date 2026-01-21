import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// NOTE: Supabase auth was removed. This AuthContext is a lightweight placeholder.
// Replace with your chosen auth solution (e.g., your backend + JWT, MongoDB Realm, etc.).

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple localStorage-backed auth for development.
  useEffect(() => {
    const stored = localStorage.getItem('ff_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setSession({ user: parsed });
      } catch (e) {
        localStorage.removeItem('ff_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // naive signup: store user in localStorage
      const userObj = { id: crypto.randomUUID(), email };
      localStorage.setItem('ff_user', JSON.stringify(userObj));
      setUser(userObj);
      setSession({ user: userObj });
      return { error: null as Error | null };
    } catch (e: any) {
      return { error: new Error(e?.message || 'Signup failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // naive signin: accept any credentials and persist
      const userObj = { id: crypto.randomUUID(), email };
      localStorage.setItem('ff_user', JSON.stringify(userObj));
      setUser(userObj);
      setSession({ user: userObj });
      return { error: null as Error | null };
    } catch (e: any) {
      return { error: new Error(e?.message || 'Sign in failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('ff_user');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}