-- El equipo quiere que la persona que se registra pueda indicar (como
-- SUGERENCIA, no como asignacion real) cual cree que es su rol y su
-- red/mentor, usando un picker de tarjetas en /registro. Sigue sin
-- tener ningun acceso real hasta que el admin lo confirme desde
-- /admin/usuarios -- esto solo pre-llena ese formulario con lo que la
-- persona indico. Ver CLAUDE.md.
drop function if exists public.listar_usuarios_pendientes();

create function public.listar_usuarios_pendientes()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  nombre_sugerido text,
  rol_sugerido text,
  red_id_sugerida text,
  mentor_id_sugerido text
)
language plpgsql security definer set search_path = public as $$
begin
  if private.current_rol() is distinct from 'admin' then
    raise exception 'Solo un admin puede ver los usuarios pendientes';
  end if;

  return query
    select
      u.id,
      u.email::text,
      u.created_at,
      (u.raw_user_meta_data ->> 'nombre_completo')::text,
      (u.raw_user_meta_data ->> 'rol_sugerido')::text,
      (u.raw_user_meta_data ->> 'red_id_sugerida')::text,
      (u.raw_user_meta_data ->> 'mentor_id_sugerido')::text
    from auth.users u
    left join perfiles p on p.id = u.id
    where p.id is null
    order by u.created_at;
end;
$$;

-- Nota: DROP + CREATE FUNCTION reinicia los grants por defecto de
-- Supabase (PUBLIC, anon y authenticated todos quedan con EXECUTE otra
-- vez). Hay que revocar de los tres explicitamente -- revocar solo de
-- "public" (el pseudo-rol) NO le quita el acceso heredado a "anon" si
-- "anon" ademas tiene un grant directo, y viceversa.
revoke execute on function public.listar_usuarios_pendientes() from public;
revoke execute on function public.listar_usuarios_pendientes() from anon;
revoke execute on function public.listar_usuarios_pendientes() from authenticated;
grant execute on function public.listar_usuarios_pendientes() to authenticated;
