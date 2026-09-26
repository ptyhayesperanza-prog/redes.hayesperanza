import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { MiembrosClient } from "./MiembrosClient";

export default async function MiembrosPage() {
  const { perfil } = (await getUsuarioActual())!;
  const redId = perfil!.red_id!;
  const supabase = await createClient();

  const [{ data: miembros }, { data: red }] = await Promise.all([
    supabase
      .from("miembros_red")
      .select("id, nombre, apellido, telefono, correo, direccion, fecha_nacimiento, activo")
      .eq("red_id", redId)
      .order("nombre"),
    supabase.from("redes").select("nombre").eq("id", redId).single(),
  ]);

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Miembros de mi Red</h2>
        <p>Información personal y estado de los miembros de {red?.nombre ?? "tu red"}.</p>
      </header>
      <MiembrosClient miembros={miembros ?? []} />
    </section>
  );
}
