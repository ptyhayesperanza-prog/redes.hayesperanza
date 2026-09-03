import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { GlassCard } from "@/components/GlassCard";
import { cerrarSesion } from "./actions";

export default async function Home() {
  const sesion = await getUsuarioActual();

  if (!sesion) redirect("/login");

  const { perfil } = sesion;

  if (!perfil) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center p-8">
        <GlassCard className="w-full max-w-md">
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
            Cuenta pendiente de aprobación
          </h1>
          <p className="mt-2 text-sm opacity-80">
            Tu cuenta ya existe, pero un admin todavía no te asigna rol y red.
            Avísale para que te active desde el panel de administración.
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
        {perfil.rol === "admin" && (
          <Link href="/admin/usuarios" className="mt-4 block text-sm underline opacity-80">
            Usuarios pendientes de aprobar
          </Link>
        )}
        <form action={cerrarSesion} className="mt-6">
          <button type="submit" className="text-sm underline opacity-80">
            Cerrar sesión
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
