import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/GlassCard";
import { ReporteForm } from "./ReporteForm";

function semanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 = domingo
  const offsetLunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + offsetLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: fmt(lunes), fin: fmt(domingo) };
}

export default async function ReportarPage() {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");

  const { perfil } = sesion;
  if (!perfil || perfil.rol !== "lider" || !perfil.red_id) redirect("/");

  const supabase = await createClient();

  const [{ data: red }, { data: roster }, { data: materiales }] = await Promise.all([
    supabase
      .from("redes")
      .select("nombre, dia_reunion, horario, direccion")
      .eq("id", perfil.red_id)
      .single(),
    supabase
      .from("miembros_red")
      .select("id, nombre, apellido, correo, telefono, direccion, fecha_nacimiento")
      .eq("red_id", perfil.red_id)
      .eq("activo", true)
      .order("nombre"),
    supabase.from("materiales").select("id, titulo").order("titulo"),
  ]);

  return (
    <main className="flex min-h-full flex-1 justify-center p-4 sm:p-8">
      <GlassCard className="w-full max-w-2xl">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
          Reporte semanal — {red?.nombre ?? "tu red"}
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">{perfil.nombre_completo}</p>
        <ReporteForm
          red={red ?? { nombre: "tu red", dia_reunion: null, horario: null, direccion: null }}
          roster={roster ?? []}
          materiales={materiales ?? []}
          semana={semanaActual()}
        />
      </GlassCard>
    </main>
  );
}
