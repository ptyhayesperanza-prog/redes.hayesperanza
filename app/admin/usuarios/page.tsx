import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/GlassCard";
import { AsignarForm } from "./AsignarForm";

export default async function UsuariosPendientesPage() {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");
  if (!sesion.perfil || sesion.perfil.rol !== "admin") redirect("/");

  const supabase = await createClient();

  const [{ data: pendientes }, { data: redes }, { data: mentores }] = await Promise.all([
    supabase.rpc("listar_usuarios_pendientes"),
    supabase.from("redes").select("id, nombre").order("nombre"),
    supabase.from("mentores").select("id, nombre").order("nombre"),
  ]);

  return (
    <main className="flex min-h-full flex-1 justify-center p-4 sm:p-8">
      <GlassCard className="w-full max-w-xl">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
          Usuarios pendientes de aprobar
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">
          Se registraron pero todavía no tienen rol ni red asignada — sin
          eso no pueden ver ningún dato.
        </p>

        {!pendientes || pendientes.length === 0 ? (
          <p className="text-sm opacity-70">No hay nadie pendiente.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendientes.map((p) => (
              <AsignarForm
                key={p.id}
                usuarioId={p.id}
                email={p.email ?? ""}
                nombreSugerido={p.nombre_sugerido}
                redes={redes ?? []}
                mentores={mentores ?? []}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </main>
  );
}
