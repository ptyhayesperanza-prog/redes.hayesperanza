import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/GlassCard";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <GlassCard className="w-full max-w-sm">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
          Redes Hay Esperanza
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">Inicia sesión para continuar.</p>
        <LoginForm />
      </GlassCard>
    </main>
  );
}
