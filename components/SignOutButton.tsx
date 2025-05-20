// src/components/SignOutButton.tsx
'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home page after sign out
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}
