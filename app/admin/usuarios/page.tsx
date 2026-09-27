import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { AsignarForm } from "./AsignarForm";

export default async function UsuariosPendientesPage() {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");
  if (!sesion.perfil || sesion.perfil.rol !== "admin") redirect("/");

  const supabase = await createClient();

  const [{ data: pendientes }, { data: redes }, { data: mentores }] = await Promise.all([
    supabase.rpc("listar_usuarios_pendientes"),
    supabase.from("redes").select("id, nombre, mentor_id, lider_referencia").order("nombre"),
    supabase.from("mentores").select("id, nombre, color").order("nombre"),
  ]);

  // Antes era una GlassCard de 576px con el estilo del login metida dentro
  // del panel: en computadora ocupaba menos de la mitad del ancho. Ahora usa
  // el mismo encabezado que el resto del panel y una cuadrícula de tarjetas.
  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Usuarios pendientes de aprobar</h2>
        <p>
          Se registraron pero todavía no tienen rol ni red asignada — sin eso no pueden ver
          ningún dato. La sugerencia es lo que ellos indicaron al registrarse; confírmala o
          cámbiala antes de asignar.
        </p>
      </header>

      {!pendientes || pendientes.length === 0 ? (
        <div className="placeholder-content">
          <h3>No hay nadie pendiente</h3>
          <p>Cuando alguien se registre en la página, aparecerá aquí para que lo apruebes.</p>
        </div>
      ) : (
        <div className="pendientes-grid">
          {pendientes.map((p) => (
            <AsignarForm
              key={p.id}
              usuarioId={p.id}
              email={p.email ?? ""}
              nombreSugerido={p.nombre_sugerido}
              rolSugerido={p.rol_sugerido}
              redIdSugerida={p.red_id_sugerida}
              mentorIdSugerido={p.mentor_id_sugerido}
              correoConfirmado={p.correo_confirmado}
              redes={redes ?? []}
              mentores={mentores ?? []}
            />
          ))}
        </div>
      )}
    </section>
  );
}
