"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, updateSupabaseClient } from "./supabase";
import { api, getBaseUrl } from "./api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: "github" | "google", redirectToPath?: string) => Promise<{ error: AuthError | null }>;
  signInAsDemo: () => Promise<{ error?: any; success?: boolean }>;
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

  const restoreDemoSessionFromStorage = () => {
    if (typeof window !== "undefined") {
      const demoToken = localStorage.getItem("companyos_demo_token");
      const demoUserJson = localStorage.getItem("companyos_demo_user");
      const demoBizId = localStorage.getItem("companyos_demo_biz_id") || "00000000-0000-0000-0000-000000000001";
      if (demoToken) {
        try {
          const parsedUser = demoUserJson ? JSON.parse(demoUserJson) : {};
          const mockUser = {
            id: parsedUser.id || demoBizId,
            email: parsedUser.email || "demo@thecompany.ai",
            business_id: demoBizId,
            user_metadata: parsedUser.user_metadata || { full_name: "Demo Evaluator / Judge", is_demo: true },
            app_metadata: { provider: "demo_1click_access", role: "authenticated" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User;

          const mockSession = {
            access_token: demoToken,
            token_type: "bearer",
            user: mockUser,
            expires_in: 7 * 86400,
            expires_at: Math.floor(Date.now() / 1000) + 7 * 86400,
          } as unknown as Session;

          setUser(mockUser);
          setSession(mockSession);
          return true;
        } catch (e) {
          console.warn("Error restoring demo session:", e);
        }
      }
    }
    return false;
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      const activeClient = await initClient();
      const configured = isSupabaseConfigured();

      if (!configured) {
        const restored = restoreDemoSessionFromStorage();
        if (!restored) {
          setUser(null);
          setSession(null);
        }
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
          // Check for saved demo session
          const restored = restoreDemoSessionFromStorage();
          if (!restored) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Failed to get Supabase session:", err);
        restoreDemoSessionFromStorage();
      } finally {
        setIsLoading(false);
      }

      const {
        data: { subscription },
      } = activeClient.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else {
          const restored = restoreDemoSessionFromStorage();
          if (!restored) {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
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
      localStorage.removeItem("companyos_demo_token");
      localStorage.removeItem("companyos_demo_user");
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
      localStorage.removeItem("companyos_demo_token");
      localStorage.removeItem("companyos_demo_user");
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

  const signInWithOAuth = async (provider: "github" | "google", redirectToPath?: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
      localStorage.removeItem("companyos_demo_token");
      localStorage.removeItem("companyos_demo_user");
    }

    const client = await initClient();
    if (!isSupabaseConfigured()) {
      return { error: { message: "Authentication is not configured" } as unknown as AuthError };
    }

    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
    const targetPath = redirectToPath || "/";
    const finalRedirect = redirectOrigin ? `${redirectOrigin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}` : undefined;

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: finalRedirect,
      },
    });
    return { error };
  };

  const signInAsDemo = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("companyos_logged_out");
    }
    try {
      const demoData = await api.demoLogin();
      if (demoData?.access_token) {
        const demoBizId = demoData.business_id || "00000000-0000-0000-0000-000000000001";
        if (typeof window !== "undefined") {
          localStorage.setItem("companyos_demo_token", demoData.access_token);
          localStorage.setItem("companyos_demo_user", JSON.stringify(demoData.user));
          localStorage.setItem("companyos_demo_biz_id", demoBizId);
        }

        const mockUser = {
          id: demoData.user?.id || demoBizId,
          email: demoData.user?.email || "demo@thecompany.ai",
          business_id: demoBizId,
          user_metadata: demoData.user?.user_metadata || { full_name: "Demo Evaluator / Judge", is_demo: true },
          app_metadata: { provider: "demo_1click_access", role: "authenticated" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as unknown as User;

        const mockSession = {
          access_token: demoData.access_token,
          token_type: "bearer",
          user: mockUser,
          expires_in: 7 * 86400,
          expires_at: Math.floor(Date.now() / 1000) + 7 * 86400,
        } as unknown as Session;

        setUser(mockUser);
        setSession(mockSession);
        return { success: true };
      }
      return { error: { message: "No access token received from demo login endpoint." } };
    } catch (err: any) {
      console.error("Demo login error:", err);
      return { error: { message: err?.message || "Failed to initialize 1-click demo access." } };
    }
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
      localStorage.removeItem("companyos_demo_token");
      localStorage.removeItem("companyos_demo_user");
      localStorage.removeItem("companyos_demo_biz_id");
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
        signInAsDemo,
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

