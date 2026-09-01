-- Esquema inicial: reemplazo del reporte semanal de Redes Hay Esperanza.
-- Ver CLAUDE.md para el contexto de producto detrás de cada tabla y las
-- decisiones de roles/permisos.

-- ============================================================
-- Tipos
-- ============================================================

create type rol_usuario as enum ('pastor', 'admin', 'mentor', 'lider');
create type tipo_asistencia as enum ('fiel', 'nuevo');

-- ============================================================
-- Tablas
-- ============================================================

create table mentores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
);

create table redes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  lider_colider_anfitrion text,
  mentor_id uuid references mentores(id),
  activa boolean not null default true
);

create table miembros_red (
  id uuid primary key default gen_random_uuid(),
  red_id uuid not null references redes(id) on delete cascade,
  nombre text not null,
  activo boolean not null default true
);

create table materiales (
  id uuid primary key default gen_random_uuid(),
  titulo text not null
);

create table temas_material (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materiales(id) on delete cascade,
  numero_capitulo integer not null,
  titulo_tema text not null,
  orden integer not null
);

-- Perfiles de usuario, uno-a-uno con auth.users de Supabase.
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  rol rol_usuario not null,
  red_id uuid references redes(id),
  mentor_id uuid references mentores(id)
);

create table reportes_semanales (
  id uuid primary key default gen_random_uuid(),
  red_id uuid not null references redes(id),
  semana_inicio date not null,
  semana_fin date not null,
  total_miembros integer,
  total_fieles integer,
  total_nuevos integer,
  se_congregan integer,
  discipulados text,
  ofrenda numeric(12, 2),
  material_id uuid references materiales(id),
  capitulo_actual integer,
  comentario_lider text,
  creado_por uuid not null references perfiles(id),
  creado_en timestamptz not null default now()
);

create table asistencia_semanal (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references reportes_semanales(id) on delete cascade,
  miembro_id uuid references miembros_red(id),
  nombre text,
  tipo tipo_asistencia not null,
  asistio boolean not null
);

-- Máximo 2 fotos por reporte: se valida en la capa de aplicación, no aquí
-- (ver CLAUDE.md).
create table fotos_reporte (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references reportes_semanales(id) on delete cascade,
  ruta_storage text not null,
  subida_por uuid not null references perfiles(id)
);

-- ============================================================
-- Vista: resumen general semanal
-- Suma reportes_semanales por semana_inicio; no es una tabla editable.
-- ============================================================

create view resumen_semanal
  with (security_invoker = true) as
select
  semana_inicio,
  semana_fin,
  sum(total_miembros) as total_miembros,
  sum(total_fieles) + sum(total_nuevos) as total_asistencia_redes,
  sum(total_nuevos) as total_nuevos,
  sum(se_congregan) as total_congregacion,
  sum(ofrenda) as total_ofrenda
from reportes_semanales
group by semana_inicio, semana_fin;

-- ============================================================
-- Funciones auxiliares para RLS.
--
-- security definer para evitar recursión al consultar perfiles desde sus
-- propias políticas. Viven en el schema `private` (no expuesto por
-- PostgREST) y solo son ejecutables por el rol `authenticated`, para que
-- no queden disponibles como endpoints RPC públicos (ver advisor de
-- seguridad de Supabase: anon/authenticated_security_definer_function).
-- ============================================================

create schema private;

create function private.current_rol() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid()
$$;

create function private.current_red_id() returns uuid
language sql stable security definer set search_path = public as $$
  select red_id from perfiles where id = auth.uid()
$$;

create function private.current_mentor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select mentor_id from perfiles where id = auth.uid()
$$;

revoke execute on function private.current_rol() from public;
revoke execute on function private.current_red_id() from public;
revoke execute on function private.current_mentor_id() from public;

grant execute on function private.current_rol() to authenticated;
grant execute on function private.current_red_id() to authenticated;
grant execute on function private.current_mentor_id() to authenticated;

grant usage on schema private to authenticated;

-- ============================================================
-- Índices en llaves foráneas usadas en joins de las políticas de RLS.
-- ============================================================

create index idx_asistencia_semanal_miembro_id on asistencia_semanal(miembro_id);
create index idx_asistencia_semanal_reporte_id on asistencia_semanal(reporte_id);
create index idx_fotos_reporte_reporte_id on fotos_reporte(reporte_id);
create index idx_fotos_reporte_subida_por on fotos_reporte(subida_por);
create index idx_miembros_red_red_id on miembros_red(red_id);
create index idx_perfiles_mentor_id on perfiles(mentor_id);
create index idx_perfiles_red_id on perfiles(red_id);
create index idx_redes_mentor_id on redes(mentor_id);
create index idx_reportes_semanales_creado_por on reportes_semanales(creado_por);
create index idx_reportes_semanales_material_id on reportes_semanales(material_id);
create index idx_reportes_semanales_red_id on reportes_semanales(red_id);
create index idx_temas_material_material_id on temas_material(material_id);

-- ============================================================
-- Row Level Security
--
-- Nota de estilo: cada tabla tiene una política de SELECT separada de las
-- políticas de escritura (insert/update/delete individuales, nunca "for
-- all"). Si una política "for all" coexistiera con la de select dedicada,
-- Postgres evaluaría ambas políticas permisivas en cada lectura (advisor
-- "multiple_permissive_policies"). auth.uid() se envuelve en `(select ...)`
-- para que el planner lo evalúe una vez por consulta, no una vez por fila
-- (advisor "auth_rls_initplan").
-- ============================================================

alter table mentores enable row level security;
alter table redes enable row level security;
alter table miembros_red enable row level security;
alter table materiales enable row level security;
alter table temas_material enable row level security;
alter table perfiles enable row level security;
alter table reportes_semanales enable row level security;
alter table asistencia_semanal enable row level security;
alter table fotos_reporte enable row level security;

-- perfiles: cada quien lee/edita su propia fila; pastor y admin leen todas;
-- solo admin escribe filas de otros (alta de usuarios).
create policy perfiles_select_propio on perfiles for select
  using (id = (select auth.uid()) or private.current_rol() in ('pastor', 'admin'));

create policy perfiles_update_propio on perfiles for update
  using (id = (select auth.uid()) or private.current_rol() = 'admin');

create policy perfiles_insert_admin on perfiles for insert
  with check (private.current_rol() = 'admin');

create policy perfiles_delete_admin on perfiles for delete
  using (private.current_rol() = 'admin');

-- mentores: lectura para pastor/admin y para el propio mentor; escritura
-- solo admin.
create policy mentores_select on mentores for select
  using (private.current_rol() in ('pastor', 'admin') or id = private.current_mentor_id());

create policy mentores_insert_admin on mentores for insert with check (private.current_rol() = 'admin');
create policy mentores_update_admin on mentores for update using (private.current_rol() = 'admin');
create policy mentores_delete_admin on mentores for delete using (private.current_rol() = 'admin');

-- redes: pastor/admin ven todas; mentor ve las suyas; líder ve la propia.
-- Escritura (alta de redes, asignación de mentor) solo admin.
create policy redes_select on redes for select
  using (
    private.current_rol() in ('pastor', 'admin')
    or mentor_id = private.current_mentor_id()
    or id = private.current_red_id()
  );

create policy redes_insert_admin on redes for insert with check (private.current_rol() = 'admin');
create policy redes_update_admin on redes for update using (private.current_rol() = 'admin');
create policy redes_delete_admin on redes for delete using (private.current_rol() = 'admin');

-- miembros_red (roster): lectura igual que redes; escritura para el líder
-- de esa red o admin.
create policy miembros_red_select on miembros_red for select
  using (
    private.current_rol() in ('pastor', 'admin')
    or red_id in (select id from redes where mentor_id = private.current_mentor_id())
    or red_id = private.current_red_id()
  );

create policy miembros_red_insert on miembros_red for insert
  with check (private.current_rol() = 'admin' or red_id = private.current_red_id());
create policy miembros_red_update on miembros_red for update
  using (private.current_rol() = 'admin' or red_id = private.current_red_id());
create policy miembros_red_delete on miembros_red for delete
  using (private.current_rol() = 'admin' or red_id = private.current_red_id());

-- materiales / temas_material: catálogo de referencia, lectura para
-- cualquier usuario autenticado, escritura solo admin.
create policy materiales_select on materiales for select
  using ((select auth.uid()) is not null);

create policy materiales_insert_admin on materiales for insert with check (private.current_rol() = 'admin');
create policy materiales_update_admin on materiales for update using (private.current_rol() = 'admin');
create policy materiales_delete_admin on materiales for delete using (private.current_rol() = 'admin');

create policy temas_material_select on temas_material for select
  using ((select auth.uid()) is not null);

create policy temas_material_insert_admin on temas_material for insert with check (private.current_rol() = 'admin');
create policy temas_material_update_admin on temas_material for update using (private.current_rol() = 'admin');
create policy temas_material_delete_admin on temas_material for delete using (private.current_rol() = 'admin');

-- reportes_semanales: lectura igual que redes (pastor/admin todo, mentor
-- lo suyo, líder su propia red); escritura (crear/editar) para el líder de
-- esa red o admin. Pastor y mentor son de solo lectura.
create policy reportes_select on reportes_semanales for select
  using (
    private.current_rol() in ('pastor', 'admin')
    or red_id in (select id from redes where mentor_id = private.current_mentor_id())
    or red_id = private.current_red_id()
  );

create policy reportes_insert on reportes_semanales for insert
  with check (private.current_rol() = 'admin' or red_id = private.current_red_id());

create policy reportes_update on reportes_semanales for update
  using (private.current_rol() = 'admin' or red_id = private.current_red_id());

create policy reportes_delete_admin on reportes_semanales for delete
  using (private.current_rol() = 'admin');

-- asistencia_semanal y fotos_reporte heredan visibilidad/edición del
-- reporte al que pertenecen.
create policy asistencia_select on asistencia_semanal for select
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() in ('pastor', 'admin')
        or red_id in (select id from redes where mentor_id = private.current_mentor_id())
        or red_id = private.current_red_id()
    )
  );

create policy asistencia_insert on asistencia_semanal for insert
  with check (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy asistencia_update on asistencia_semanal for update
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy asistencia_delete on asistencia_semanal for delete
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy fotos_select on fotos_reporte for select
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() in ('pastor', 'admin')
        or red_id in (select id from redes where mentor_id = private.current_mentor_id())
        or red_id = private.current_red_id()
    )
  );

create policy fotos_insert on fotos_reporte for insert
  with check (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy fotos_update on fotos_reporte for update
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );

create policy fotos_delete on fotos_reporte for delete
  using (
    reporte_id in (
      select id from reportes_semanales
      where private.current_rol() = 'admin' or red_id = private.current_red_id()
    )
  );
