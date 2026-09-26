-- Revision 2026-09-26: listar_usuarios_pendientes() incluia cuentas que
-- nunca confirmaron su correo. Cualquiera puede registrarse con un correo
-- ajeno (p. ej. el de un pastor) y aparecer en la lista con ese nombre; no
-- puede entrar sin confirmar, pero el admin podria aprobarla creyendo que es
-- legitima. Se agrega correo_confirmado para que la app bloquee la
-- aprobacion hasta que el correo este confirmado.
--
-- Cambia el tipo de retorno -> hay que DROP + CREATE, y eso reinicia los
-- grants por defecto de Supabase: revocar de public, anon Y authenticated
-- antes de re-otorgar (ver nota en 0006).

drop function if exists public.listar_usuarios_pendientes();

create function public.listar_usuarios_pendientes()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  nombre_sugerido text,
  rol_sugerido text,
  red_id_sugerida text,
  mentor_id_sugerido text,
  correo_confirmado boolean
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
      (u.raw_user_meta_data ->> 'mentor_id_sugerido')::text,
      u.email_confirmed_at is not null
    from auth.users u
    left join perfiles p on p.id = u.id
    where p.id is null
    order by u.created_at;
end;
$$;

revoke execute on function public.listar_usuarios_pendientes() from public;
revoke execute on function public.listar_usuarios_pendientes() from anon;
revoke execute on function public.listar_usuarios_pendientes() from authenticated;
grant execute on function public.listar_usuarios_pendientes() to authenticated;
