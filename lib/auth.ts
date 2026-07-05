import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { rateLimit } from './rate-limit';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Brute-force brake: per IP and per targeted account.
        const headers = (req as { headers?: Record<string, string | string[] | undefined> })?.headers;
        const fwd = headers?.['x-forwarded-for'];
        const ip = (Array.isArray(fwd) ? fwd[0] : fwd || 'unknown').split(',')[0].trim();
        const email = credentials.email.toLowerCase();
        const byIp = rateLimit(`login-ip:${ip}`, 15, 5 * 60_000);
        // The shared demo account is exempt from the per-email brake (every
        // "Try the demo" click is a login for it); per-IP still applies.
        const byEmail =
          email === 'demo@themis.app'
            ? { ok: true }
            : rateLimit(`login-email:${email}`, 8, 5 * 60_000);
        if (!byIp.ok || !byEmail.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          station: user.station,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.station = (user as { station?: string }).station;
      }
      // Client-initiated refresh (useSession().update) after a profile change.
      if (trigger === 'update' && typeof session?.name === 'string' && session.name.trim()) {
        token.name = session.name.trim();
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string; station?: string }).id = token.id as string;
        (session.user as { id?: string; station?: string }).station = token.station as string;
      }
      return session;
    },
  },
};
