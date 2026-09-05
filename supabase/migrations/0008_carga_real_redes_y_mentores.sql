-- Carga real de mentorias, lideres y numeracion de redes, provista por el
-- equipo (2026-09-04). Los 7 mentores ya existian (migracion 0002); esto
-- agrega las 30 redes reales que faltaban (solo existia "Red de Prueba").
--
-- El lider de cada red normalmente se identifica via perfiles.red_id (ver
-- CLAUDE.md), pero estos lideres todavia no se registran en el sistema.
-- redes.lider_referencia guarda su nombre solo como referencia para mostrar
-- en las tarjetas de red y en el selector de /registro mientras tanto; una
-- vez que el lider real se registra y el admin lo aprueba, perfiles.red_id
-- pasa a ser la fuente de verdad y este campo queda como dato historico.
alter table redes add column lider_referencia text;

insert into redes (nombre, mentor_id, lider_referencia) values
  -- Lucy de Candanedo (Verde)
  ('Red 016', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Giania Peñaloza'),
  ('Red 002', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Juan Camilo Moreno'),
  ('Red 037', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Iris Bermudez'),
  ('Red 041', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Vianet Rook'),
  ('Red 009', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Sana Palma'),
  ('Red 048', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Julio Medal'),
  ('Red 049', '8dbc74a8-c508-4e66-adda-1ca8eebc9b4a', 'Benjamin y Mary'),

  -- Cesar y Yara Cordoba (Turquesa)
  ('Red 035', '0944c181-1e59-4170-9a67-01bd15929497', 'Melesio y Rita Leaño'),
  ('Red 010', '0944c181-1e59-4170-9a67-01bd15929497', 'Leticia Marco Hermoso'),
  ('Red 018', '0944c181-1e59-4170-9a67-01bd15929497', 'Danitza Vargas'),
  ('Red 050', '0944c181-1e59-4170-9a67-01bd15929497', 'Marilu Arias'),
  ('Red 051', '0944c181-1e59-4170-9a67-01bd15929497', 'Orlando/Yanelly Tenorio'),

  -- Migdalia de Delgado (Rojo)
  ('Red 005', '9813c0ee-7f62-4dd3-a28d-51e58eaeaa93', 'Veira Díaz'),
  ('Red 017', '9813c0ee-7f62-4dd3-a28d-51e58eaeaa93', 'Julia Garcia M.'),
  ('Red 032', '9813c0ee-7f62-4dd3-a28d-51e58eaeaa93', 'Poulet Morales'),

  -- Pastor Eliel (Azul)
  ('Red 052', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'Roger Báez'),
  ('Red 053', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'Yazquelly Peñaloza'),
  ('Red 054', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'IvanJosue Delgado'),
  ('Red 055', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'Marco Gómez'),
  ('Red 056', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'Hillary Carvajal'),
  ('Red 057', '8e403b49-273a-4bf7-84d7-4f4090f558ce', 'Reynier Quintero'),

  -- Pastor Marco (Naranja peach)
  ('Red 001', 'c596a185-e248-4929-aa2b-185e8057335d', 'Marco Gomez'),

  -- Perla y Edwin Rodriguez (Morado)
  ('Red 044', 'ab11fc14-b495-4166-acaa-bbc54d1b6c3e', 'Carlos y Jahidary Palma'),
  ('Red 045', 'ab11fc14-b495-4166-acaa-bbc54d1b6c3e', 'Edwin y Nuria Escala'),
  ('Red 046', 'ab11fc14-b495-4166-acaa-bbc54d1b6c3e', 'Isela y Carlos Quintero'),
  ('Red 047', 'ab11fc14-b495-4166-acaa-bbc54d1b6c3e', 'Felix e Ileana Gonzalez'),

  -- Norma de Torrijos (Blanco)
  ('Red 031', '6d915d92-19e3-40de-8705-14eb04ece6c5', 'Lilia Kwaiben'),
  ('Red 025', '6d915d92-19e3-40de-8705-14eb04ece6c5', 'Marisela Pinzón'),
  ('Red 042', '6d915d92-19e3-40de-8705-14eb04ece6c5', 'Rosina Martínez'),
  ('Red 040', '6d915d92-19e3-40de-8705-14eb04ece6c5', 'Anita Villalaz');

-- listar_redes_publico() ahora tambien expone mentor_id y lider_referencia,
-- necesarios para agrupar por mentoria y mostrar el nombre del lider en el
-- selector de /registro (antes solo devolvia id+nombre). Sigue siendo
-- security definer sin exponer nada mas sensible (roster, direccion, etc.).
drop function if exists public.listar_redes_publico();

create function public.listar_redes_publico()
returns table (id uuid, nombre text, mentor_id uuid, lider_referencia text)
language sql stable security definer set search_path = public as $$
  select id, nombre, mentor_id, lider_referencia from redes where activa order by nombre;
$$;

-- Nota (ver 0006): DROP + CREATE FUNCTION reinicia los grants por defecto de
-- Supabase (PUBLIC, anon y authenticated quedan con EXECUTE otra vez). Hay
-- que revocar de los tres explicitamente antes de re-otorgar.
revoke execute on function public.listar_redes_publico() from public;
revoke execute on function public.listar_redes_publico() from anon;
revoke execute on function public.listar_redes_publico() from authenticated;
grant execute on function public.listar_redes_publico() to anon, authenticated;
