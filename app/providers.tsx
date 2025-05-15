// src/app/providers.tsx
'use client'; // This component needs to be a Client Component

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // You could add other global providers here if needed (e.g., Theme provider)
  return <SessionProvider>{children}</SessionProvider>;
}