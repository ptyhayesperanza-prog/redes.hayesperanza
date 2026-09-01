"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";

export async function crearReporteSemanal(formData: FormData) {
  const sesion = await getUsuarioActual();
  if (!sesion || sesion.perfil.rol !== "lider" || !sesion.perfil.red_id) {
    redirect("/login");
  }

  const redId = sesion.perfil.red_id;
  const supabase = await createClient();

  const { data: roster } = await supabase
    .from("miembros_red")
    .select("id")
    .eq("red_id", redId)
    .eq("activo", true);

  const rosterIds = (roster ?? []).map((m) => m.id);
  const asistieron = new Set(formData.getAll("asistio").map(String));
  const nuevos = formData
    .getAll("nuevo_nombre")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const semanaInicio = String(formData.get("semana_inicio"));
  const semanaFin = String(formData.get("semana_fin"));
  const seCongreganRaw = formData.get("se_congregan");
  const ofrendaRaw = formData.get("ofrenda");
  const capituloRaw = formData.get("capitulo_actual");
  const materialIdRaw = formData.get("material_id");
  const discipuladosRaw = formData.get("discipulados");
  const comentarioLiderRaw = formData.get("comentario_lider");

  const { data: reporte, error } = await supabase
    .from("reportes_semanales")
    .insert({
      red_id: redId,
      creado_por: sesion.user.id,
      semana_inicio: semanaInicio,
      semana_fin: semanaFin,
      total_miembros: rosterIds.length,
      total_fieles: rosterIds.filter((id) => asistieron.has(id)).length,
      total_nuevos: nuevos.length,
      se_congregan: seCongreganRaw ? Number(seCongreganRaw) : null,
      discipulados: discipuladosRaw ? String(discipuladosRaw) : null,
      ofrenda: ofrendaRaw ? Number(ofrendaRaw) : null,
      material_id: materialIdRaw ? String(materialIdRaw) : null,
      capitulo_actual: capituloRaw ? Number(capituloRaw) : null,
      comentario_lider: comentarioLiderRaw ? String(comentarioLiderRaw) : null,
    })
    .select("id")
    .single();

  if (error || !reporte) {
    throw new Error(error?.message ?? "No se pudo crear el reporte.");
  }

  const filas = [
    ...rosterIds
      .filter((id) => asistieron.has(id))
      .map((id) => ({
        reporte_id: reporte.id,
        miembro_id: id,
        nombre: null,
        tipo: "fiel" as const,
        asistio: true,
      })),
    ...nuevos.map((nombre) => ({
      reporte_id: reporte.id,
      miembro_id: null,
      nombre,
      tipo: "nuevo" as const,
      asistio: true,
    })),
  ];

  if (filas.length > 0) {
    const { error: asistErr } = await supabase.from("asistencia_semanal").insert(filas);
    if (asistErr) throw new Error(asistErr.message);
  }

  redirect(`/reportar/exito?id=${reporte.id}`);
}
