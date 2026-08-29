import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Use at the top of any server component or action that touches business data. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
