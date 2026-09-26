-- Revision 2026-09-26: un reporte no puede ser de una semana que todavia
-- no empieza (casi siempre es un error de tipeo en el anio o el mes, y
-- ocuparia esa semana: el lider no podria crear el reporte real despues).
-- El server action ya lo valida; esto cubre llamadas directas a la API.
--
-- "Hoy" se toma en hora de Panama (la base corre en UTC: a partir de las
-- 7 p. m. en Panama, current_date ya es el dia siguiente).
--
-- create or replace conserva los grants de 0009 (solo authenticated).

create or replace function public.crear_reporte_semanal(
  p_reporte jsonb,
  p_asistencia jsonb default '[]'::jsonb,
  p_peticiones jsonb default '[]'::jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
  v_red uuid := (p_reporte ->> 'red_id')::uuid;
  v_inicio date := (p_reporte ->> 'semana_inicio')::date;
  v_fin date := (p_reporte ->> 'semana_fin')::date;
begin
  if v_inicio > (now() at time zone 'America/Panama')::date then
    raise exception 'La semana del reporte todavia no empieza'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from reportes_semanales r
    where r.red_id = v_red
      and daterange(r.semana_inicio, r.semana_fin, '[]') && daterange(v_inicio, v_fin, '[]')
  ) then
    raise exception 'Ya existe un reporte de esta red para esa semana'
      using errcode = 'unique_violation';
  end if;

  insert into reportes_semanales (
    red_id, creado_por, semana_inicio, semana_fin, dia_habitual, fecha_reunion,
    hora_reunion, total_miembros, total_fieles, total_nuevos, se_congregan,
    se_recogio_ofrenda, ofrenda, discipulados, material_id, capitulo_actual,
    comentario_lider
  )
  select
    v_red, auth.uid(), v_inicio, v_fin, r.dia_habitual, r.fecha_reunion,
    r.hora_reunion, r.total_miembros, r.total_fieles, r.total_nuevos, r.se_congregan,
    r.se_recogio_ofrenda, r.ofrenda, r.discipulados, r.material_id, r.capitulo_actual,
    r.comentario_lider
  from jsonb_populate_record(null::reportes_semanales, p_reporte) r
  returning id into v_id;

  insert into asistencia_semanal (
    reporte_id, miembro_id, nombre, tipo, asistio, invitado_por,
    se_congrega, dio_ofrenda, discipulado, comentario_miembro
  )
  select
    v_id, a.miembro_id, a.nombre, a.tipo, coalesce(a.asistio, false), a.invitado_por,
    coalesce(a.se_congrega, false), coalesce(a.dio_ofrenda, false), a.discipulado,
    a.comentario_miembro
  from jsonb_populate_recordset(null::asistencia_semanal, p_asistencia) a;

  insert into peticiones_oracion (reporte_id, miembro_id, nombre, descripcion)
  select v_id, p.miembro_id, p.nombre, p.descripcion
  from jsonb_populate_recordset(null::peticiones_oracion, p_peticiones) p;

  return v_id;
end;
$$;
