-- Autoregistro (2026-09-03): el equipo pidio que lideres, coliders,
-- mentores y pastor puedan crear su propia cuenta (correo + contrasena)
-- en vez de que el admin tenga que invitarlos uno por uno. Esto
-- REEMPLAZA la decision anterior de "solo por invitacion" — ver
-- CLAUDE.md.
--
-- No hace falta ningun cambio de RLS para que esto sea seguro: una
-- cuenta de auth.users sin fila en perfiles ya no tiene absolutamente
-- ningun acceso, porque private.current_rol()/current_red_id()/
-- current_mentor_id() devuelven NULL y todas las politicas comparan
-- contra esos valores. El admin sigue siendo el unico que puede
-- insertar en perfiles (perfiles_insert_admin, sin cambios).
--
-- Esta funcion es lo que le permite al admin VER quienes se
-- registraron y aun no tienen perfil. auth.users no esta expuesto via
-- PostgREST, asi que hace falta security definer -- NO se usa una
-- vista (para evitar el lint "security definer view" de Supabase) sino
-- una funcion que verifica el rol de quien llama por dentro.
create or replace function public.listar_usuarios_pendientes()
returns table (id uuid, email text, created_at timestamptz, nombre_sugerido text)
language plpgsql security definer set search_path = public as $$
begin
  if private.current_rol() is distinct from 'admin' then
    raise exception 'Solo un admin puede ver los usuarios pendientes';
  end if;

  return query
    select u.id, u.email::text, u.created_at, (u.raw_user_meta_data ->> 'nombre_completo')::text
    from auth.users u
    left join perfiles p on p.id = u.id
    where p.id is null
    order by u.created_at;
end;
$$;

-- Supabase otorga EXECUTE a anon/authenticated automaticamente al crear
-- una funcion nueva (grant directo, no solo via PUBLIC) -- hay que
-- revocarlo explicitamente de ambos antes de re-otorgar solo a
-- authenticated (anon jamas debe poder llamarla; authenticated si,
-- porque el propio admin es 'authenticated' y la funcion se protege
-- por dentro).
revoke execute on function public.listar_usuarios_pendientes() from anon;
revoke execute on function public.listar_usuarios_pendientes() from authenticated;
grant execute on function public.listar_usuarios_pendientes() to authenticated;
