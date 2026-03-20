'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import StyledComponentsRegistry from '@/lib/registry';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
      <StyledComponentsRegistry>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </StyledComponentsRegistry>
    </SessionProvider>
  );
}
