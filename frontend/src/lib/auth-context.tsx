"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

  const initClient = useCallback(async () => {
    if (isSupabaseConfigured()) {
      return supabase;
    }
    try {
      const res = await fetch(`${getBaseUrl()}/api/v1/config`);
      if (res.ok) {
        const data = await res.json();
        if (data?.supabaseUrl && data?.supabaseKey && !data.supabaseUrl.includes("placeholder-project")) {
          const client = updateSupabaseClient(data.supabaseUrl, data.supabaseKey);
          setIsConfiguredState(true);
          return client;
        }
      }
    } catch (e) {
      console.warn("Could not load runtime Supabase config:", e);
    }
    return supabase;
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      const activeClient = await initClient();
      const configured = isSupabaseConfigured();

      if (!configured) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Real Supabase session management
      try {
        const { data } = await activeClient.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Clean OAuth hash from URL if present
          if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to get Supabase session:", err);
      } finally {
        setIsLoading(false);
      }

      const {
        data: { subscription },
      } = activeClient.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (session && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    };

    setupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initClient]);

  const signInWithPassword = async (email: string, password: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }

    const client = await initClient();
    if (!isSupabaseConfigured()) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }

    const client = await initClient();
    if (!isSupabaseConfigured()) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const { error } = await client.auth.signUp({
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

    const client = await initClient();
    if (!isSupabaseConfigured()) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : undefined;

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const client = await initClient();
      if (isSupabaseConfigured()) {
        await client.auth.signOut();
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
