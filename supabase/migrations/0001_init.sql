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

create view resumen_semanal as
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
-- Funciones auxiliares para RLS (security definer para evitar
-- recursión al consultar perfiles desde sus propias políticas).
-- ============================================================

create function current_rol() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid()
$$;

create function current_red_id() returns uuid
language sql stable security definer set search_path = public as $$
  select red_id from perfiles where id = auth.uid()
$$;

create function current_mentor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select mentor_id from perfiles where id = auth.uid()
$$;

-- ============================================================
-- Row Level Security
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
  using (id = auth.uid() or current_rol() in ('pastor', 'admin'));

create policy perfiles_update_propio on perfiles for update
  using (id = auth.uid() or current_rol() = 'admin');

create policy perfiles_insert_admin on perfiles for insert
  with check (current_rol() = 'admin');

create policy perfiles_delete_admin on perfiles for delete
  using (current_rol() = 'admin');

-- mentores: lectura para pastor/admin y para el propio mentor; escritura
-- solo admin.
create policy mentores_select on mentores for select
  using (current_rol() in ('pastor', 'admin') or id = current_mentor_id());

create policy mentores_write_admin on mentores for all
  using (current_rol() = 'admin')
  with check (current_rol() = 'admin');

-- redes: pastor/admin ven todas; mentor ve las suyas; líder ve la propia.
-- Escritura (alta de redes, asignación de mentor) solo admin.
create policy redes_select on redes for select
  using (
    current_rol() in ('pastor', 'admin')
    or mentor_id = current_mentor_id()
    or id = current_red_id()
  );

create policy redes_write_admin on redes for all
  using (current_rol() = 'admin')
  with check (current_rol() = 'admin');

-- miembros_red (roster): lectura igual que redes; escritura para el líder
-- de esa red o admin.
create policy miembros_red_select on miembros_red for select
  using (
    current_rol() in ('pastor', 'admin')
    or red_id in (select id from redes where mentor_id = current_mentor_id())
    or red_id = current_red_id()
  );

create policy miembros_red_write on miembros_red for all
  using (current_rol() = 'admin' or red_id = current_red_id())
  with check (current_rol() = 'admin' or red_id = current_red_id());

-- materiales / temas_material: catálogo de referencia, lectura para
-- cualquier usuario autenticado, escritura solo admin.
create policy materiales_select on materiales for select
  using (auth.uid() is not null);

create policy materiales_write_admin on materiales for all
  using (current_rol() = 'admin')
  with check (current_rol() = 'admin');

create policy temas_material_select on temas_material for select
  using (auth.uid() is not null);

create policy temas_material_write_admin on temas_material for all
  using (current_rol() = 'admin')
  with check (current_rol() = 'admin');

-- reportes_semanales: lectura igual que redes (pastor/admin todo, mentor
-- lo suyo, líder su propia red); escritura (crear/editar) para el líder de
-- esa red o admin. Pastor y mentor son de solo lectura.
create policy reportes_select on reportes_semanales for select
  using (
    current_rol() in ('pastor', 'admin')
    or red_id in (select id from redes where mentor_id = current_mentor_id())
    or red_id = current_red_id()
  );

create policy reportes_insert on reportes_semanales for insert
  with check (current_rol() = 'admin' or red_id = current_red_id());

create policy reportes_update on reportes_semanales for update
  using (current_rol() = 'admin' or red_id = current_red_id());

create policy reportes_delete_admin on reportes_semanales for delete
  using (current_rol() = 'admin');

-- asistencia_semanal y fotos_reporte heredan visibilidad/edición del
-- reporte al que pertenecen.
create policy asistencia_select on asistencia_semanal for select
  using (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() in ('pastor', 'admin')
        or red_id in (select id from redes where mentor_id = current_mentor_id())
        or red_id = current_red_id()
    )
  );

create policy asistencia_write on asistencia_semanal for all
  using (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() = 'admin' or red_id = current_red_id()
    )
  )
  with check (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() = 'admin' or red_id = current_red_id()
    )
  );

create policy fotos_select on fotos_reporte for select
  using (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() in ('pastor', 'admin')
        or red_id in (select id from redes where mentor_id = current_mentor_id())
        or red_id = current_red_id()
    )
  );

create policy fotos_write on fotos_reporte for all
  using (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() = 'admin' or red_id = current_red_id()
    )
  )
  with check (
    reporte_id in (
      select id from reportes_semanales
      where current_rol() = 'admin' or red_id = current_red_id()
    )
  );
