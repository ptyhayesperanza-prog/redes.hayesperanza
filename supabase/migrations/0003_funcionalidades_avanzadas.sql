-- Nuevas funcionalidades pedidas por el equipo (2026-09-03):
-- colider con cuenta propia, ofrenda si/no + monto, cambio de dia de
-- reunion, trazabilidad de quien invito a cada visita, perfil de
-- miembro (apellido/correo/cumpleanos/direccion), peticiones de
-- oracion por miembro, y "miembro fiel" calculado sobre 3 meses de
-- historial. Ver CLAUDE.md para el contexto completo de cada decision.
--
-- Nota sobre "colider": no requiere un rol nuevo. perfiles.red_id no
-- tiene restriccion de unicidad, asi que el admin simplemente puede
-- crear una segunda cuenta con rol 'lider' apuntando a la misma red;
-- las politicas de RLS ya le dan permisos identicos al lider sobre esa
-- red sin ningun cambio adicional.

-- Ofrenda: se pregunta si hubo (si/no) ademas del monto ya existente.
alter table reportes_semanales
  add column se_recogio_ofrenda boolean not null default false;

-- Cambio de dia: si la red no se reunio en su dia/hora habitual, se
-- registra la fecha y hora reales.
alter table reportes_semanales
  add column dia_habitual boolean not null default true,
  add column fecha_reunion date,
  add column hora_reunion text;

-- Visitas: trazabilidad de quien invito a cada visita nueva.
alter table asistencia_semanal
  add column invitado_por uuid references miembros_red(id);

create index idx_asistencia_semanal_invitado_por on asistencia_semanal(invitado_por);

-- Perfil de miembro (roster).
alter table miembros_red
  add column apellido text,
  add column correo text,
  add column fecha_nacimiento date,
  add column direccion text;

-- Peticiones de oracion, ligadas a un miembro del roster (o a un nombre
-- libre si la peticion es de alguien fuera del roster, ej. una visita).
create table peticiones_oracion (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references reportes_semanales(id) on delete cascade,
  miembro_id uuid references miembros_red(id),
  nombre text,
  descripcion text not null check (char_length(descripcion) <= 500),
  creado_en timestamptz not null default now()
);

create index idx_peticiones_oracion_reporte_id on peticiones_oracion(reporte_id);
create index idx_peticiones_oracion_miembro_id on peticiones_oracion(miembro_id);

alter table peticiones_oracion enable row level security;

create policy peticiones_oracion_select on peticiones_oracion for select
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() in ('pastor', 'admin')
        or red_id in (select id from redes where mentor_id = private.current_mentor_id())
        or red_id = private.current_red_id()
    )
  );

create policy peticiones_oracion_insert on peticiones_oracion for insert
  with check (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy peticiones_oracion_update on peticiones_oracion for update
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy peticiones_oracion_delete on peticiones_oracion for delete
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

-- Extiende el trigger de integridad para tambien validar invitado_por
-- (debe pertenecer a la misma red que el reporte).
create or replace function private.check_asistencia_miembro_red() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_red_reporte uuid;
  v_red_miembro uuid;
  v_red_invitador uuid;
begin
  select red_id into v_red_reporte from reportes_semanales where id = new.reporte_id;

  if new.miembro_id is not null then
    select red_id into v_red_miembro from miembros_red where id = new.miembro_id;
    if v_red_reporte is distinct from v_red_miembro then
      raise exception 'El miembro no pertenece a la red de este reporte';
    end if;
  end if;

  if new.invitado_por is not null then
    select red_id into v_red_invitador from miembros_red where id = new.invitado_por;
    if v_red_reporte is distinct from v_red_invitador then
      raise exception 'El invitador no pertenece a la red de este reporte';
    end if;
  end if;

  return new;
end;
$$;

-- Mismo tipo de validacion de integridad para peticiones_oracion.
create function private.check_peticion_miembro_red() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_red_reporte uuid;
  v_red_miembro uuid;
begin
  if new.miembro_id is not null then
    select red_id into v_red_reporte from reportes_semanales where id = new.reporte_id;
    select red_id into v_red_miembro from miembros_red where id = new.miembro_id;
    if v_red_reporte is distinct from v_red_miembro then
      raise exception 'El miembro no pertenece a la red de este reporte';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_peticion_miembro_red
before insert or update on peticiones_oracion
for each row execute function private.check_peticion_miembro_red();

-- "Miembro fiel" = asistio a mas de la mitad de los reportes de su red
-- en los ultimos N meses (default 3). Calculado al vuelo (no
-- almacenado, para que nunca quede desactualizado). No es security
-- definer: corre con el RLS de quien consulta.
create function miembro_es_fiel(p_miembro_id uuid, p_meses integer default 3) returns boolean
language sql stable set search_path = public as $$
  with reportes_red as (
    select r.id
    from reportes_semanales r
    join miembros_red m on m.red_id = r.red_id
    where m.id = p_miembro_id
      and r.semana_inicio >= (current_date - (p_meses || ' months')::interval)
  ),
  asistencias as (
    select count(*) as n
    from asistencia_semanal a
    where a.miembro_id = p_miembro_id
      and a.asistio = true
      and a.reporte_id in (select id from reportes_red)
  )
  select case
    when (select count(*) from reportes_red) = 0 then false
    else (select n from asistencias)::numeric / (select count(*) from reportes_red) > 0.5
  end;
$$;
