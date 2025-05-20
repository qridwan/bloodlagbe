// src/next-auth.d.ts  (or types/next-auth.d.ts)

import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// Import your UserRole enum if you have it defined in Prisma schema and want to use it
// Assuming your Prisma UserRole enum is available (e.g. via Prisma.UserRole)
// If not, you can use a string literal type e.g. "USER" | "ADMIN"
// For simplicity, let's use string for now if UserRole isn't easily importable here.
type UserRole = 'USER' | 'ADMIN'; // Or import { UserRole } from "@prisma/client" if accessible

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's database id. */
      id: string;
      /** The user's role. */
      role?: UserRole;
    } & DefaultSession['user']; // Extends the default user properties (name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a JWT session strategy.
   * Also the shape of the user object returned by the `authorize` callback of the Credentials provider.
   */
  interface User extends DefaultUser {
    /** The user's database id. */
    id: string;
    /** The user's role. */
    role?: UserRole;
  }
}
