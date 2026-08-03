"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ComponentProps } from "react";
import { AuthProvider } from "@/lib/auth-context";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NextThemesProvider {...props}>
          {children}
        </NextThemesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
