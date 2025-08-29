import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    if (session?.user) {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116: "exact-one" violation - no rows returned
        console.error("Error fetching profile:", error);
        setUser(session.user);
      } else {
        setUser({ ...session.user, profile });
      }

    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (identity, password) => {
    const raw = (identity ?? '').trim();
    const isEmail = raw.includes('@');
    let payload = null;

    if (isEmail) {
      const email = raw.toLowerCase();
      payload = { email, password };
    } else {
      // Normalize BR phones to E.164
      const digits = raw.replace(/\\D/g, '');
      let phone = null;
      if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
        phone = '+' + digits;
      } else if (digits.length >= 10 && digits.length <= 11) {
        phone = '+55' + digits;
      } else if (raw.startsWith('+')) {
        phone = raw;
      }
      if (!phone) {
        toast({
          variant: "destructive",
          title: "Login por telefone inválido",
          description: "Use e-mail válido ou telefone no formato +55DDDXXXXXXXX.",
        });
        return { error: new Error("invalid phone format") };
      }
      payload = { phone, password };
    }

    const { data, error } = await supabase.auth.signInWithPassword(payload);

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "E-mail/telefone ou senha inválidos.",
      });
    } else {
       toast({ title: "Login realizado com sucesso!", description: `Bem-vindo(a)!` });
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Usuário';

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    displayName,
  }), [user, session, loading, signUp, signIn, signOut, displayName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};