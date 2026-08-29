import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe slice of the auth config. Middleware imports only this, so Prisma
 * and bcrypt never get pulled into the edge runtime.
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days — re-login is pure friction for a single user
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
