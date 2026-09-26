-- Auditoria 2026-09-25. Cierra huecos encontrados al cruzar el codigo con
-- la base real. Ver CLAUDE.md, seccion "Auditoria integral (2026-09-25)".

-- ============================================================
-- 1. Guardado atomico del reporte semanal.
--
-- Antes, el server action insertaba reportes_semanales, asistencia_semanal
-- y peticiones_oracion en 3 llamadas separadas. Si la 2a fallaba, el
-- reporte quedaba huerfano (sin asistencia) y, como el lider no puede
-- borrar reportes, se quedaba ahi para siempre. En la base real ya habia
-- uno (Red de Prueba, 2026-09-01, 0 filas de asistencia, reintentado un
-- minuto despues). Una funcion plpgsql corre en una sola transaccion: o
-- se guarda todo o nada.
--
-- security invoker: corre con el RLS y los triggers de quien llama,
-- exactamente igual que los inserts directos de antes. No abre nada nuevo.
-- ============================================================

create function public.crear_reporte_semanal(
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
  -- Una red no puede tener dos reportes para semanas que se traslapan
  -- (se sumarian doble en el resumen general).
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

  -- coalesce: jsonb_populate_recordset deja NULL en las claves ausentes,
  -- y estas columnas son "not null default false".
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

revoke execute on function public.crear_reporte_semanal(jsonb, jsonb, jsonb) from public;
revoke execute on function public.crear_reporte_semanal(jsonb, jsonb, jsonb) from anon;
revoke execute on function public.crear_reporte_semanal(jsonb, jsonb, jsonb) from authenticated;
grant execute on function public.crear_reporte_semanal(jsonb, jsonb, jsonb) to authenticated;

-- ============================================================
-- 2. Restricciones de datos que solo validaba el navegador.
-- ============================================================

alter table reportes_semanales
  add constraint reportes_semana_valida
    check (semana_fin >= semana_inicio and semana_fin - semana_inicio <= 6),
  add constraint reportes_ofrenda_no_negativa check (ofrenda is null or ofrenda >= 0),
  add constraint reportes_capitulo_positivo check (capitulo_actual is null or capitulo_actual > 0),
  add constraint reportes_totales_no_negativos check (
    coalesce(total_miembros, 0) >= 0 and coalesce(total_fieles, 0) >= 0
    and coalesce(total_nuevos, 0) >= 0 and coalesce(se_congregan, 0) >= 0
  );

-- ============================================================
-- 3. Fotos: maximo 2 por reporte (decision de producto) forzado en la
-- base, no solo en el navegador; y limites al bucket (antes aceptaba
-- cualquier tipo y tamano de archivo).
-- ============================================================

create function private.check_max_fotos_reporte() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Serializa inserts concurrentes del mismo reporte.
  perform 1 from reportes_semanales where id = new.reporte_id for update;
  if (select count(*) from fotos_reporte where reporte_id = new.reporte_id) >= 2 then
    raise exception 'Un reporte admite como maximo 2 fotos';
  end if;
  return new;
end;
$$;

create trigger trg_check_max_fotos_reporte
before insert on fotos_reporte
for each row execute function private.check_max_fotos_reporte();

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'fotos-reportes';

-- ============================================================
-- 4. Autoria: creado_por ya se forzaba en INSERT, pero un lider podia
-- cambiarlo despues con un UPDATE. Solo admin puede reasignarlo.
-- ============================================================

create function private.keep_creado_por() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.current_rol() is distinct from 'admin' then
    new.creado_por := old.creado_por;
  end if;
  return new;
end;
$$;

create trigger trg_keep_creado_por
before update on reportes_semanales
for each row execute function private.keep_creado_por();

-- ============================================================
-- 5. Higiene de grants: las funciones de RLS en `private` tenian EXECUTE
-- para anon (el revoke de 0001 fue solo "from public", y Supabase ademas
-- otorga directo a anon). anon no tiene USAGE sobre `private`, asi que no
-- era alcanzable, pero no hay razon para dejarlo.
-- ============================================================

revoke execute on function private.current_rol() from anon;
revoke execute on function private.current_red_id() from anon;
revoke execute on function private.current_mentor_id() from anon;

-- ============================================================
-- 6. resumen_semanal sumaba `ofrenda` aunque se_recogio_ofrenda = false
-- (fila de antes de 0003), mientras la app muestra 0 en ese caso. Se
-- alinea la vista con la app.
-- ============================================================

create or replace view resumen_semanal
  with (security_invoker = true) as
select
  semana_inicio,
  semana_fin,
  sum(total_miembros) as total_miembros,
  sum(total_fieles) + sum(total_nuevos) as total_asistencia_redes,
  sum(total_nuevos) as total_nuevos,
  sum(se_congregan) as total_congregacion,
  sum(ofrenda) filter (where se_recogio_ofrenda) as total_ofrenda
from reportes_semanales
group by semana_inicio, semana_fin;
