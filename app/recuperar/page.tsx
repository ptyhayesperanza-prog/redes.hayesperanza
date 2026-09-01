import { GlassCard } from "@/components/GlassCard";
import { RecuperarForm } from "./RecuperarForm";

export default function RecuperarPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <GlassCard className="w-full max-w-sm">
        <h1 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--accent)]">
          Recuperar contraseña
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">
          Ponemos tu correo y te enviamos un enlace para elegir una contraseña
          nueva.
        </p>
        <RecuperarForm />
      </GlassCard>
    </main>
  );
}
