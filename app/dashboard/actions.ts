"use server";

import { createClient } from "@/lib/supabase/server";

export type DetalleReporte = {
  redNombre: string;
  semanaInicio: string;
  semanaFin: string;
  reunion: string;
  totalMiembros: number;
  ofrenda: number;
  congregan: number;
  materialTitulo: string | null;
  capituloActual: number | null;
  discipuladosGeneral: string | null;
  comentarioGeneral: string | null;
  fieles: string[];
  faltaron: string[];
  visitantes: { nombre: string; invitadoPor: string | null }[];
  notasMiembro: { nombre: string; discipulado: string | null; comentario: string | null }[];
  peticiones: { nombre: string; descripcion: string }[];
  fotos: string[];
};

const nombreCompleto = (m: { nombre: string; apellido: string | null } | null) =>
  m ? `${m.nombre} ${m.apellido ?? ""}`.trim() : null;

/**
 * Desglose de un reporte semanal con nombres (fieles / nuevos / faltaron) —
 * decisión de producto: "vista de asistencia con dos niveles", visible al
 * expandir para mentor/líder/pastor por igual (ver CLAUDE.md). RLS ya
 * restringe qué reportes puede leer la sesión actual: si no puede verlo,
 * `reporte` sale null y no se consulta nada más.
 */
export async function obtenerDetalleReporte(reporteId: string): Promise<DetalleReporte | null> {
  const supabase = await createClient();

  const { data: reporte } = await supabase
    .from("reportes_semanales")
    .select(
      "red_id, semana_inicio, semana_fin, dia_habitual, fecha_reunion, hora_reunion, total_miembros, se_congregan, se_recogio_ofrenda, ofrenda, capitulo_actual, discipulados, comentario_lider, redes(nombre, dia_reunion, horario), materiales(titulo)",
    )
    .eq("id", reporteId)
    .maybeSingle();

  if (!reporte) return null;

  const [{ data: asistencia }, { data: roster }, { data: peticiones }, { data: fotos }] =
    await Promise.all([
      supabase
        .from("asistencia_semanal")
        .select(
          "miembro_id, nombre, tipo, asistio, discipulado, comentario_miembro, miembro:miembros_red!asistencia_semanal_miembro_id_fkey(nombre, apellido), invitador:miembros_red!asistencia_semanal_invitado_por_fkey(nombre, apellido)",
        )
        .eq("reporte_id", reporteId),
      supabase
        .from("miembros_red")
        .select("id, nombre, apellido")
        .eq("red_id", reporte.red_id)
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("peticiones_oracion")
        .select("nombre, descripcion, miembros_red(nombre, apellido)")
        .eq("reporte_id", reporteId)
        .order("creado_en"),
      supabase.from("fotos_reporte").select("ruta_storage").eq("reporte_id", reporteId),
    ]);

  const filas = asistencia ?? [];

  // Los nombres de quienes asistieron salen de la fila de asistencia (no del
  // roster actual), para que un miembro desactivado después siga apareciendo
  // en los reportes viejos donde sí asistió.
  const asistieronIds = new Set<string>();
  const fieles: string[] = [];
  filas.forEach((a) => {
    if (a.tipo === "fiel" && a.asistio && a.miembro_id) {
      asistieronIds.add(a.miembro_id);
      fieles.push(nombreCompleto(a.miembro) ?? "Miembro");
    }
  });
  fieles.sort((x, y) => x.localeCompare(y, "es"));

  // "Faltaron" se calcula contra el roster activo actual: el esquema no
  // guarda una foto del roster de cada semana.
  const faltaron = (roster ?? [])
    .filter((m) => !asistieronIds.has(m.id))
    .map((m) => nombreCompleto(m) as string);

  const visitantes = filas
    .filter((a) => a.tipo === "nuevo")
    .map((a) => ({ nombre: a.nombre ?? "Visita sin nombre", invitadoPor: nombreCompleto(a.invitador) }));

  const notasMiembro = filas
    .filter((a) => a.discipulado || a.comentario_miembro)
    .map((a) => ({
      nombre: nombreCompleto(a.miembro) ?? a.nombre ?? "Miembro",
      discipulado: a.discipulado,
      comentario: a.comentario_miembro,
    }));

  const rutas = (fotos ?? []).map((f) => f.ruta_storage);
  const { data: firmadas } =
    rutas.length > 0
      ? await supabase.storage.from("fotos-reportes").createSignedUrls(rutas, 60 * 60)
      : { data: [] };

  const red = reporte.redes;
  const reunion = reporte.dia_habitual
    ? [red?.dia_reunion, red?.horario].filter(Boolean).join(" · ") || "Día habitual"
    : `Cambio de día: ${[reporte.fecha_reunion, reporte.hora_reunion].filter(Boolean).join(" · ") || "sin fecha indicada"}`;

  return {
    redNombre: red?.nombre ?? "Red",
    semanaInicio: reporte.semana_inicio,
    semanaFin: reporte.semana_fin,
    reunion,
    totalMiembros: reporte.total_miembros ?? 0,
    ofrenda: reporte.se_recogio_ofrenda ? (reporte.ofrenda ?? 0) : 0,
    congregan: reporte.se_congregan ?? 0,
    materialTitulo: reporte.materiales?.titulo ?? null,
    capituloActual: reporte.capitulo_actual,
    discipuladosGeneral: reporte.discipulados,
    comentarioGeneral: reporte.comentario_lider,
    fieles,
    faltaron,
    visitantes,
    notasMiembro,
    peticiones: (peticiones ?? []).map((p) => ({
      nombre: nombreCompleto(p.miembros_red) ?? p.nombre ?? "Sin nombre",
      descripcion: p.descripcion,
    })),
    fotos: (firmadas ?? []).flatMap((f) => (f.signedUrl ? [f.signedUrl] : [])),
  };
}
