"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";

export async function crearReporteSemanal(formData: FormData) {
  const sesion = await getUsuarioActual();
  if (!sesion || !sesion.perfil || sesion.perfil.rol !== "lider" || !sesion.perfil.red_id) {
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
  const congregan = new Set(formData.getAll("congrega").map(String));
  const dieronOfrenda = new Set(formData.getAll("ofrenda_miembro").map(String));

  const diaHabitual = String(formData.get("dia_habitual")) === "true";
  const semanaInicio = String(formData.get("semana_inicio"));
  const semanaFin = String(formData.get("semana_fin"));
  const fechaReunion = diaHabitual ? null : (formData.get("fecha_reunion") as string) || null;
  const horaReunion = diaHabitual ? null : (formData.get("hora_reunion") as string) || null;

  const seRecogioOfrenda = formData.get("se_recogio_ofrenda") === "on";
  const ofrendaRaw = formData.get("ofrenda");
  const capituloRaw = formData.get("capitulo_actual");
  const materialIdRaw = formData.get("material_id");
  const discipuladosRaw = formData.get("discipulados");
  const comentarioLiderRaw = formData.get("comentario_lider");

  const nuevosNombres = formData.getAll("nuevo_nombre").map(String);
  const nuevosInvitadoPor = formData.getAll("nuevo_invitado_por").map(String);

  const peticionMiembroId = formData.getAll("peticion_miembro_id").map(String);
  const peticionNombreOtro = formData.getAll("peticion_nombre_otro").map(String);
  const peticionDescripcion = formData.getAll("peticion_descripcion").map(String);

  const totalFieles = rosterIds.filter((id) => asistieron.has(id)).length;
  const totalCongregan = rosterIds.filter((id) => congregan.has(id)).length;
  const totalNuevos = nuevosNombres.filter((n) => n.trim()).length;

  const { data: reporte, error } = await supabase
    .from("reportes_semanales")
    .insert({
      red_id: redId,
      creado_por: sesion.user.id,
      semana_inicio: semanaInicio,
      semana_fin: semanaFin,
      dia_habitual: diaHabitual,
      fecha_reunion: fechaReunion,
      hora_reunion: horaReunion,
      total_miembros: rosterIds.length,
      total_fieles: totalFieles,
      total_nuevos: totalNuevos,
      se_congregan: totalCongregan,
      se_recogio_ofrenda: seRecogioOfrenda,
      ofrenda: seRecogioOfrenda && ofrendaRaw ? Number(ofrendaRaw) : null,
      discipulados: discipuladosRaw ? String(discipuladosRaw) : null,
      material_id: materialIdRaw ? String(materialIdRaw) : null,
      capitulo_actual: capituloRaw ? Number(capituloRaw) : null,
      comentario_lider: comentarioLiderRaw ? String(comentarioLiderRaw) : null,
    })
    .select("id")
    .single();

  if (error || !reporte) {
    throw new Error(error?.message ?? "No se pudo crear el reporte.");
  }

  const filasMiembros = rosterIds
    .map((id) => {
      const asistio = asistieron.has(id);
      const seCongrega = congregan.has(id);
      const dioOfrenda = dieronOfrenda.has(id);
      const discipulado = (formData.get(`discipulado_${id}`) as string)?.trim() || null;
      const comentario = (formData.get(`comentario_${id}`) as string)?.trim() || null;

      const tieneAlgo = asistio || seCongrega || dioOfrenda || discipulado || comentario;
      if (!tieneAlgo) return null;

      return {
        reporte_id: reporte.id,
        miembro_id: id,
        nombre: null,
        tipo: "fiel" as const,
        asistio,
        se_congrega: seCongrega,
        dio_ofrenda: dioOfrenda,
        discipulado,
        comentario_miembro: comentario,
      };
    })
    .filter((fila) => fila !== null);

  const filasNuevos = nuevosNombres
    .map((nombre, i) => ({ nombre: nombre.trim(), invitadoPor: nuevosInvitadoPor[i] || null }))
    .filter((n) => n.nombre)
    .map((n) => ({
      reporte_id: reporte.id,
      miembro_id: null,
      nombre: n.nombre,
      tipo: "nuevo" as const,
      asistio: true,
      invitado_por: n.invitadoPor,
      // Supabase arma un solo INSERT con la union de columnas de todas
      // las filas del array; a las filas que no traen una clave les
      // manda NULL explicito en vez de aplicar el default de la
      // columna. Hay que repetir los defaults a mano en cada fila.
      se_congrega: false,
      dio_ofrenda: false,
      discipulado: null,
      comentario_miembro: null,
    }));

  const filas = [...filasMiembros, ...filasNuevos];

  if (filas.length > 0) {
    const { error: asistErr } = await supabase.from("asistencia_semanal").insert(filas);
    if (asistErr) throw new Error(asistErr.message);
  }

  const filasPeticiones = peticionDescripcion
    .map((descripcion, i) => ({
      descripcion: descripcion.trim(),
      miembroId: peticionMiembroId[i] || null,
      nombreOtro: peticionNombreOtro[i]?.trim() || null,
    }))
    .filter((p) => p.descripcion)
    .map((p) => ({
      reporte_id: reporte.id,
      miembro_id: p.miembroId,
      nombre: p.miembroId ? null : p.nombreOtro,
      descripcion: p.descripcion,
    }));

  if (filasPeticiones.length > 0) {
    const { error: peticionesErr } = await supabase
      .from("peticiones_oracion")
      .insert(filasPeticiones);
    if (peticionesErr) throw new Error(peticionesErr.message);
  }

  redirect(`/reportar/exito?id=${reporte.id}`);
}
