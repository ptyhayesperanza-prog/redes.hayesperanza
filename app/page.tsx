import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { GlassCard } from "@/components/GlassCard";
import { cerrarSesion } from "./actions";

export default async function Home() {
  const sesion = await getUsuarioActual();

  if (!sesion) redirect("/login");

  const { perfil } = sesion;

  if (perfil.rol === "lider") redirect("/reportar");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <GlassCard className="w-full max-w-md">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
          Redes Hay Esperanza
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Hola, {perfil.nombre_completo} ({perfil.rol}). El panel de consulta
          todavía está en construcción.
        </p>
        <form action={cerrarSesion} className="mt-6">
          <button type="submit" className="text-sm underline opacity-80">
            Cerrar sesión
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
