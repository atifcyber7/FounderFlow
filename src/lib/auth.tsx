import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export type AppRole = 'admin' | 'member' | 'client' | 'outsourced';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
  isOutsourced: boolean;
  userRole: AppRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  isClient: false,
  isOutsourced: false,
  userRole: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const navigate = useNavigate();

  const isAdmin = userRole === 'admin';
  const isClient = userRole === 'client';
  const isOutsourced = userRole === 'outsourced';

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check role when session changes
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data?.role) {
      setUserRole(data.role as AppRole);
    } else {
      setUserRole('member'); // Default role
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut, 
      isAdmin,
      isClient,
      isOutsourced,
      userRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
