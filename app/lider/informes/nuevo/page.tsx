import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { semanaActual } from "@/lib/fecha";
import { ReporteForm } from "./ReporteForm";

export default async function NuevoInformePage() {
  const { perfil } = (await getUsuarioActual())!;
  const redId = perfil!.red_id!;
  const supabase = await createClient();

  const [{ data: red }, { data: roster }, { data: materiales }] = await Promise.all([
    supabase
      .from("redes")
      .select("nombre, dia_reunion, horario, direccion")
      .eq("id", redId)
      .single(),
    supabase
      .from("miembros_red")
      .select("id, nombre, apellido, correo, telefono, direccion, fecha_nacimiento")
      .eq("red_id", redId)
      .eq("activo", true)
      .order("nombre"),
    supabase.from("materiales").select("id, titulo").order("titulo"),
  ]);

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Crear Informe</h2>
        <p>Registra la asistencia, las visitas y la ofrenda de tu reunión — {red?.nombre ?? "tu red"}.</p>
      </header>
      <ReporteForm
        red={red ?? { nombre: "tu red", dia_reunion: null, horario: null, direccion: null }}
        roster={roster ?? []}
        materiales={materiales ?? []}
        semana={semanaActual()}
      />
    </section>
  );
}
