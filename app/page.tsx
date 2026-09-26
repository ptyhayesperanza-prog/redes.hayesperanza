import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { GlassCard } from "@/components/GlassCard";
import { cerrarSesion } from "./actions";

export default async function Home() {
  const sesion = await getUsuarioActual();

  if (!sesion) redirect("/login");

  const { perfil } = sesion;

  // Un líder sin red o un mentor sin mentoría no tiene a dónde ir: su
  // layout lo mandaría de vuelta aquí y quedaría en un bucle de
  // redirecciones. Se trata igual que una cuenta pendiente.
  const perfilIncompleto =
    !!perfil &&
    ((perfil.rol === "lider" && !perfil.red_id) || (perfil.rol === "mentor" && !perfil.mentor_id));

  if (!perfil || perfilIncompleto) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center p-8">
        <GlassCard className="w-full max-w-md">
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
            Cuenta pendiente de aprobación
          </h1>
          <p className="mt-2 text-sm opacity-80">
            {perfilIncompleto
              ? "Tu cuenta tiene rol, pero todavía no tiene red o mentoría asignada. Avísale al admin para que la complete."
              : "Tu cuenta ya existe, pero un admin todavía no te asigna rol y red. Avísale para que te active desde el panel de administración."}
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

  if (perfil.rol === "lider") redirect("/lider");
  if (perfil.rol === "mentor") redirect("/mentor");
  if (perfil.rol === "pastor") redirect("/pastor");
  redirect("/admin");
}
