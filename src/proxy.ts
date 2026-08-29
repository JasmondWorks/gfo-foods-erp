import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 renamed the middleware convention to `proxy`; behaviour is unchanged.
// Every route is protected except /login — see FR-1.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
