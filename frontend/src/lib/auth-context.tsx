"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, updateSupabaseClient } from "./supabase";
import { getBaseUrl } from "./api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfiguredState, setIsConfiguredState] = useState<boolean>(isSupabaseConfigured());

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      let activeClient = supabase;
      let configured = isSupabaseConfigured();

      // If not configured via build-time env vars, attempt runtime discovery from backend /api/v1/config
      if (!configured) {
        try {
          const res = await fetch(`${getBaseUrl()}/api/v1/config`);
          if (res.ok) {
            const data = await res.json();
            if (data?.supabaseUrl && data?.supabaseKey && !data.supabaseUrl.includes("placeholder-project")) {
              activeClient = updateSupabaseClient(data.supabaseUrl, data.supabaseKey);
              configured = true;
              setIsConfiguredState(true);
            }
          }
        } catch {
          // Runtime config fetch optional fallback
        }
      }

      if (!configured) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Real Supabase session management
      activeClient.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = activeClient.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();
    };

    setupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }

    if (!isConfiguredState) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }

    if (!isConfiguredState) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
        },
      },
    });
    return { error };
  };

  const signInWithOAuth = async (provider: "github" | "google") => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }

    if (!isConfiguredState) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      if (isConfiguredState) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Signout error:", err);
    }
    setUser(null);
    setSession(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("companyos_logged_out", "true");
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isConfiguredState,
        signInWithPassword,
        signUpWithPassword,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
