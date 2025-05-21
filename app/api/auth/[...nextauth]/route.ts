import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Configure the Prisma adapter to connect next-auth to your database
  adapter: PrismaAdapter(prisma),

  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign-in form (e.g., "Sign in with...")
      name: 'Credentials',
      // `credentials` is used to generate a form on the sign-in page.
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing');
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.error('No user found with email:', credentials.email);
          // Optionally, you could throw an error or return a specific error object
          return null;
        }

        // IMPORTANT: Check if the user has a hashed password set.
        // Users created via OAuth might not have one initially.
        if (!user.hashedPassword) {
          console.error('User exists but has no password set (maybe OAuth user?)');
          // Decide how to handle this: maybe prompt them to set a password?
          // For now, we deny login via credentials.
          return null;
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValidPassword) {
          console.error('Invalid password for user:', credentials.email);
          return null;
        }

        console.log('Credentials valid for user:', user.email);
        // Return the user object if credentials are valid
        // Only return necessary fields, avoid sending sensitive data like password hash
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // Include role for authorization checks
          image: user.image,
        };
      },
    }),
    // Add other providers like Google, GitHub, etc. here
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],

  // Define the session strategy
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for session management
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed (e.g., sign in, session check).
  callbacks: {
    // The `session` callback is called whenever a session is checked.
    // We can use it to add custom data (like user ID and role) to the session object.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub ?? ''; // Add user ID from the JWT's sub claim
        // Fetch the user role from the database based on the token's sub (userId)
        // This ensures the role is always up-to-date, even if changed after login.
        const userFromDb = await prisma.user.findUnique({ where: { id: token.sub } });
        session.user.role = userFromDb?.role; // Add user role
      }
      return session;
    },

    // The `jwt` callback is called whenever a JWT is created or updated.
    // The `token` object is what gets encrypted in the JWT.
    async jwt({ token, user }) {
      // On initial sign in, `user` object is available
      if (user) {
        token.sub = user.id; // Persist the user ID (`sub` is standard JWT claim for subject)
        // Persist the user role directly in the JWT initially
        // Note: Role won't update in JWT until next login if changed in DB.
        // The session callback above *does* fetch the latest role from DB.
        token.role = user.role;
      }
      return token;
    },
  },

  // Specify custom pages if needed (optional)
  // pages: {
  //   signIn: '/auth/signin',
  //   // signOut: '/auth/signout',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  //   // verifyRequest: '/auth/verify-request', // (used for email sign in)
  //   // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  // },

  // Secret for signing tokens. Use a strong random string in production.
  // Required for JWT strategy and Credentials provider.
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
};

// Export the handlers for GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
