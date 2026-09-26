"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { hoyISO } from "@/lib/fecha";

export type ReporteState = { error: string | null };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function texto(valor: FormDataEntryValue | null, max: number): string | null {
  const t = String(valor ?? "").trim();
  return t ? t.slice(0, max) : null;
}

export async function crearReporteSemanal(
  _prev: ReporteState,
  formData: FormData,
): Promise<ReporteState> {
  const sesion = await getUsuarioActual();
  if (!sesion || !sesion.perfil || sesion.perfil.rol !== "lider" || !sesion.perfil.red_id) {
    redirect("/login");
  }

  const redId = sesion.perfil.red_id;
  const supabase = await createClient();

  const semanaInicio = String(formData.get("semana_inicio") ?? "");
  const semanaFin = String(formData.get("semana_fin") ?? "");
  if (!FECHA.test(semanaInicio) || !FECHA.test(semanaFin) || semanaFin < semanaInicio) {
    return { error: "Revisa las fechas de la semana: el fin no puede ser antes del inicio." };
  }
  // Una semana que todavía no empieza no puede tener reunión que reportar
  // (casi siempre es un error de tipeo en el año o el mes).
  if (semanaInicio > hoyISO()) {
    return { error: "La semana todavía no empieza: revisa la fecha de inicio." };
  }

  const { data: roster } = await supabase
    .from("miembros_red")
    .select("id")
    .eq("red_id", redId)
    .eq("activo", true);

  const rosterIds = (roster ?? []).map((m) => m.id);
  const enRoster = new Set(rosterIds);

  const asistieron = new Set(formData.getAll("asistio").map(String));
  const congregan = new Set(formData.getAll("congrega").map(String));
  const dieronOfrenda = new Set(formData.getAll("ofrenda_miembro").map(String));

  const diaHabitual = String(formData.get("dia_habitual")) === "true";
  const fechaReunionRaw = String(formData.get("fecha_reunion") ?? "");
  const fechaReunion = !diaHabitual && FECHA.test(fechaReunionRaw) ? fechaReunionRaw : null;
  const horaReunion = diaHabitual ? null : texto(formData.get("hora_reunion"), 20);

  const seRecogioOfrenda = formData.get("se_recogio_ofrenda") === "on";
  const ofrenda = seRecogioOfrenda ? Number(formData.get("ofrenda") || 0) : null;
  if (ofrenda !== null && (!Number.isFinite(ofrenda) || ofrenda < 0)) {
    return { error: "El monto de la ofrenda no es válido." };
  }

  const capituloRaw = formData.get("capitulo_actual");
  const capitulo = capituloRaw ? Number(capituloRaw) : null;
  if (capitulo !== null && (!Number.isInteger(capitulo) || capitulo < 1)) {
    return { error: "El capítulo debe ser un número entero mayor que 0." };
  }

  const filasMiembros = rosterIds.flatMap((id) => {
    const asistio = asistieron.has(id);
    const seCongrega = congregan.has(id);
    const dioOfrenda = dieronOfrenda.has(id);
    const discipulado = texto(formData.get(`discipulado_${id}`), 200);
    const comentario = texto(formData.get(`comentario_${id}`), 200);
    if (!(asistio || seCongrega || dioOfrenda || discipulado || comentario)) return [];
    return [
      {
        miembro_id: id,
        tipo: "fiel",
        asistio,
        se_congrega: seCongrega,
        dio_ofrenda: dioOfrenda,
        discipulado,
        comentario_miembro: comentario,
      },
    ];
  });

  const nuevosInvitadoPor = formData.getAll("nuevo_invitado_por").map(String);
  const filasNuevos = formData
    .getAll("nuevo_nombre")
    .map((nombre, i) => ({ nombre: String(nombre).trim().slice(0, 120), invitadoPor: nuevosInvitadoPor[i] }))
    .filter((n) => n.nombre)
    .map((n) => ({
      nombre: n.nombre,
      tipo: "nuevo",
      asistio: true,
      invitado_por: n.invitadoPor && enRoster.has(n.invitadoPor) ? n.invitadoPor : null,
    }));

  const peticionMiembroId = formData.getAll("peticion_miembro_id").map(String);
  const peticionNombreOtro = formData.getAll("peticion_nombre_otro").map(String);
  const filasPeticiones = formData
    .getAll("peticion_descripcion")
    .map((d, i) => {
      const miembroId = enRoster.has(peticionMiembroId[i]) ? peticionMiembroId[i] : null;
      return {
        descripcion: String(d).trim().slice(0, 200),
        miembro_id: miembroId,
        nombre: miembroId ? null : peticionNombreOtro[i]?.trim().slice(0, 120) || null,
      };
    })
    .filter((p) => p.descripcion);

  const { data: reporteId, error } = await supabase.rpc("crear_reporte_semanal", {
    p_reporte: {
      red_id: redId,
      semana_inicio: semanaInicio,
      semana_fin: semanaFin,
      dia_habitual: diaHabitual,
      fecha_reunion: fechaReunion,
      hora_reunion: horaReunion,
      total_miembros: rosterIds.length,
      total_fieles: rosterIds.filter((id) => asistieron.has(id)).length,
      total_nuevos: filasNuevos.length,
      se_congregan: rosterIds.filter((id) => congregan.has(id)).length,
      se_recogio_ofrenda: seRecogioOfrenda,
      ofrenda,
      discipulados: texto(formData.get("discipulados"), 2000),
      material_id: texto(formData.get("material_id"), 64),
      capitulo_actual: capitulo,
      comentario_lider: texto(formData.get("comentario_lider"), 2000),
    },
    p_asistencia: [...filasMiembros, ...filasNuevos],
    p_peticiones: filasPeticiones,
  });

  if (error || !reporteId) {
    if (error?.code === "23505") {
      return {
        error: "Ya existe un reporte de tu red para esa semana. Puedes consultarlo en Mis Informes.",
      };
    }
    if (error?.message.includes("todavia no empieza")) {
      return { error: "La semana todavía no empieza: revisa la fecha de inicio." };
    }
    if (error?.message.includes("reportes_semana_valida")) {
      return { error: "La semana debe durar como máximo 7 días." };
    }
    return { error: "No se pudo guardar el reporte. Intenta de nuevo; no se guardó nada a medias." };
  }

  redirect(`/lider/informes/nuevo/exito?id=${reporteId}`);
}
