import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/server/services/settings";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const settings = await getSettings();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold">{settings.businessName}</h1>
      <p className="mb-8 text-muted-foreground text-sm">Sign in to keep your books.</p>
      <LoginForm />
    </main>
  );
}
