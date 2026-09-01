import { GlassCard } from "@/components/GlassCard";
import { ActualizarContrasenaForm } from "./ActualizarContrasenaForm";

export default function ActualizarContrasenaPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <GlassCard className="w-full max-w-sm">
        <h1 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--accent)]">
          Nueva contraseña
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">
          Elige la contraseña con la que vas a entrar de ahora en adelante.
        </p>
        <ActualizarContrasenaForm />
      </GlassCard>
    </main>
  );
}
